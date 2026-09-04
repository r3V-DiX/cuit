import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@cykruit/prisma';
import { AuditService } from '@cykruit/audit';
import { EmployerLimitsService } from '@cykruit/subscription';
import { MailService } from '@cykruit/mail';
import { JobsRepository } from '../repositories/jobs.repository';
import { CompanyRepository } from '../repositories/company.repository';
import { getQueueToken } from '@nestjs/bull';
import { AI_QUEUES } from '@cykruit/ai';
import { JobStatus, ApplicationType } from '@prisma/client';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JobErrorCodes } from '@cykruit/common';

describe('JobsService', () => {
    let service: JobsService;
    let jobsRepository: jest.Mocked<JobsRepository>;
    let companyRepository: jest.Mocked<CompanyRepository>;
    let prisma: any;
    let configService: jest.Mocked<ConfigService>;
    let auditService: jest.Mocked<AuditService>;
    let employerLimitsService: jest.Mocked<EmployerLimitsService>;
    let mailService: jest.Mocked<MailService>;
    let aiQueue: any;

    beforeEach(async () => {
        const mockJobsRepository = {
            create: jest.fn(),
            findBySlug: jest.fn(),
            findByIdAndEmployer: jest.fn(),
            countActive: jest.fn(),
            updateStatus: jest.fn(),
            getDetailInclude: jest.fn().mockReturnValue({}),
        };
        const mockCompanyRepository = {
            findByMemberId: jest.fn(),
        };
        const mockPrisma = {
            $transaction: jest.fn((cb) => cb(mockPrisma)),
            employer: {
                findUnique: jest.fn().mockResolvedValue(null),
                update: jest.fn().mockResolvedValue({ nextJobCodeNumber: 2 }),
            },
            job: {
                findUnique: jest.fn().mockResolvedValue(null),
                count: jest.fn().mockResolvedValue(0),
                update: jest.fn().mockResolvedValue({ id: 'job-1', status: JobStatus.PENDING }),
            },
            location: {
                findFirst: jest.fn(),
                create: jest.fn(),
            },
            admin: {
                findMany: jest.fn().mockResolvedValue([]),
            },
            jobSkill: {
                createMany: jest.fn(),
            },
            skill: {
                findMany: jest.fn().mockResolvedValue([]),
            },
        };
        const mockConfigService = {
            get: jest.fn(),
        };
        const mockAuditService = {
            logAction: jest.fn(),
        };
        const mockEmployerLimitsService = {
            resolveForEmployer: jest.fn(),
        };
        const mockMailService = {
            sendJobReviewNotification: jest.fn().mockResolvedValue(true),
        };
        const mockAiQueue = {
            add: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JobsService,
                { provide: JobsRepository, useValue: mockJobsRepository },
                { provide: CompanyRepository, useValue: mockCompanyRepository },
                { provide: PrismaService, useValue: mockPrisma },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: AuditService, useValue: mockAuditService },
                { provide: EmployerLimitsService, useValue: mockEmployerLimitsService },
                { provide: MailService, useValue: mockMailService },
                { provide: getQueueToken(AI_QUEUES.AI_JOBS), useValue: mockAiQueue },
            ],
        }).compile();

        service = module.get<JobsService>(JobsService);
        jobsRepository = module.get(JobsRepository);
        companyRepository = module.get(CompanyRepository);
        prisma = module.get(PrismaService);
        configService = module.get(ConfigService);
        auditService = module.get(AuditService);
        employerLimitsService = module.get(EmployerLimitsService);
        mailService = module.get(MailService);
        aiQueue = module.get(getQueueToken(AI_QUEUES.AI_JOBS));
    });

    describe('create', () => {
        it('should successfully create a draft job', async () => {
            const userId = 'user-1';
            const dto = {
                jobTitle: 'Software Engineer',
                jobType: 'FULL_TIME' as any,
                workMode: 'REMOTE' as any,
                experienceLevel: 'MID' as any,
                applicationType: ApplicationType.DIRECT,
            };

            companyRepository.findByMemberId.mockResolvedValue({
                id: 'emp-1',
                companyName: 'Red Ventures',
                jobCodePrefix: 'RV',
                slug: 'emp',
                isVerified: true,
            } as any);
            jobsRepository.findBySlug.mockResolvedValue(null);
            
            const mockCreatedJob = { id: 'job-1', jobTitle: 'Software Engineer', status: JobStatus.DRAFT };
            jobsRepository.create.mockResolvedValue(mockCreatedJob as any);

            const result = await service.create(userId, dto);

            expect(result).toEqual(mockCreatedJob);
            expect(jobsRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    jobTitle: 'Software Engineer',
                    jobCode: 'RV-0001',
                    status: JobStatus.DRAFT,
                }),
                expect.anything(),
            );
            expect(auditService.logAction).toHaveBeenCalled();
        });

        it('should generate and persist prefix if employer.jobCodePrefix is null', async () => {
            const userId = 'user-1';
            const dto = {
                jobTitle: 'Frontend Engineer',
                jobType: 'FULL_TIME' as any,
                workMode: 'REMOTE' as any,
                experienceLevel: 'MID' as any,
                applicationType: ApplicationType.DIRECT,
            };

            companyRepository.findByMemberId.mockResolvedValue({
                id: 'emp-2',
                companyName: 'Google',
                jobCodePrefix: null,
                slug: 'google',
                isVerified: true,
            } as any);
            prisma.employer.findUnique.mockResolvedValue(null);
            prisma.employer.update.mockResolvedValue({ nextJobCodeNumber: 2 });
            jobsRepository.findBySlug.mockResolvedValue(null);
            jobsRepository.create.mockResolvedValue({ id: 'job-2' } as any);

            await service.create(userId, dto);

            // Should have set prefix GOO
            expect(prisma.employer.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'emp-2' },
                    data: { jobCodePrefix: 'GOO' },
                }),
            );
            expect(jobsRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    jobCode: 'GOO-0001',
                }),
                expect.anything(),
            );
        });

        it('should throw ForbiddenException if employer is not verified', async () => {
            companyRepository.findByMemberId.mockResolvedValue({ id: 'emp-1', isVerified: false } as any);

            await expect(service.create('user-1', {} as any)).rejects.toThrow(ForbiddenException);
            await expect(service.create('user-1', {} as any)).rejects.toThrow(JobErrorCodes.COMPANY_NOT_VERIFIED);
        });

        it('should throw BadRequestException if EXTERNAL type but no url', async () => {
            companyRepository.findByMemberId.mockResolvedValue({ id: 'emp-1', isVerified: true } as any);
            const dto = { applicationType: ApplicationType.EXTERNAL };

            await expect(service.create('user-1', dto as any)).rejects.toThrow(BadRequestException);
        });
    });

    describe('submit', () => {
        it('should successfully submit a DRAFT job to PENDING', async () => {
            const userId = 'user-1';
            const jobId = 'job-1';
            
            companyRepository.findByMemberId.mockResolvedValue({ id: 'emp-1', isVerified: true, companyName: 'Corp' } as any);
            jobsRepository.findByIdAndEmployer.mockResolvedValue({ id: jobId, status: JobStatus.DRAFT, jobTitle: 'Dev' } as any);
            employerLimitsService.resolveForEmployer.mockResolvedValue({ maxActiveJobs: 5 } as any);
            prisma.job.count.mockResolvedValue(1);
            
            const mockSubmittedJob = { id: jobId, status: JobStatus.PENDING, jobTitle: 'Dev', jobType: 'FULL_TIME', workMode: 'REMOTE' };
            prisma.job.update.mockResolvedValue(mockSubmittedJob as any);

            const result = await service.submit(userId, jobId);

            expect(result.status).toBe(JobStatus.PENDING);
            expect(prisma.job.update).toHaveBeenCalledWith({
                where: { id: jobId },
                data: { status: JobStatus.PENDING, rejectionReason: null },
                include: {},
            });
            expect(auditService.logAction).toHaveBeenCalled();
        });

        it('should throw BadRequestException if job limit reached', async () => {
            companyRepository.findByMemberId.mockResolvedValue({ id: 'emp-1', isVerified: true } as any);
            jobsRepository.findByIdAndEmployer.mockResolvedValue({ id: 'job-1', status: JobStatus.DRAFT } as any);
            employerLimitsService.resolveForEmployer.mockResolvedValue({ maxActiveJobs: 2 } as any);
            prisma.job.count.mockResolvedValue(2);

            await expect(service.submit('user-1', 'job-1')).rejects.toThrow(BadRequestException);
            await expect(service.submit('user-1', 'job-1')).rejects.toThrow(JobErrorCodes.JOB_LIMIT_REACHED);
        });

        it('should throw BadRequestException if job is not in DRAFT or REJECTED status', async () => {
            companyRepository.findByMemberId.mockResolvedValue({ id: 'emp-1', isVerified: true } as any);
            jobsRepository.findByIdAndEmployer.mockResolvedValue({ id: 'job-1', status: JobStatus.APPROVED } as any);

            await expect(service.submit('user-1', 'job-1')).rejects.toThrow(BadRequestException);
            await expect(service.submit('user-1', 'job-1')).rejects.toThrow(JobErrorCodes.INVALID_JOB_STATUS);
        });
    });
});
