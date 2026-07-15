import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '@cykruit/prisma';
import { AIService } from '@cykruit/ai';
import { EventPublisher } from '@cykruit/events';
import { AuditService } from '@cykruit/audit';
import { ApplicationsRepository } from '../repositories/applications.repository';
import { ApplicationStatus, JobStatus, ApplicationType } from '@prisma/client';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApplicationErrorCodes, UserErrorCodes } from '@cykruit/common';

describe('ApplicationsService', () => {
    let service: ApplicationsService;
    let applicationsRepository: jest.Mocked<ApplicationsRepository>;
    let prisma: any;
    let aiService: jest.Mocked<AIService>;
    let eventPublisher: jest.Mocked<EventPublisher>;
    let auditService: jest.Mocked<AuditService>;

    beforeEach(async () => {
        const mockApplicationsRepository = {
            create: jest.fn(),
            findBySeekerAndJob: jest.fn(),
            findByIdAndSeeker: jest.fn(),
            updateStatus: jest.fn(),
            updateAiScore: jest.fn(),
            incrementJobApplicationCount: jest.fn(),
            decrementJobApplicationCount: jest.fn(),
            findBySeeker: jest.fn(),
        };

        const mockPrisma = {
            job: {
                findUnique: jest.fn(),
            },
            jobSeekerProfile: {
                findUnique: jest.fn(),
            },
            employerMember: {
                findFirst: jest.fn(),
            },
            resume: {
                findFirst: jest.fn(),
            },
        };

        const mockAiService = {
            generate: jest.fn(),
        };

        const mockEventPublisher = {
            publish: jest.fn(),
        };

        const mockAuditService = {
            logAction: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ApplicationsService,
                { provide: ApplicationsRepository, useValue: mockApplicationsRepository },
                { provide: PrismaService, useValue: mockPrisma },
                { provide: AIService, useValue: mockAiService },
                { provide: EventPublisher, useValue: mockEventPublisher },
                { provide: AuditService, useValue: mockAuditService },
            ],
        }).compile();

        service = module.get<ApplicationsService>(ApplicationsService);
        applicationsRepository = module.get(ApplicationsRepository);
        prisma = module.get(PrismaService);
        aiService = module.get(AIService);
        eventPublisher = module.get(EventPublisher);
        auditService = module.get(AuditService);
    });

    describe('apply', () => {
        const mockJob = {
            id: 'job-1',
            jobTitle: 'Developer',
            status: JobStatus.APPROVED,
            expiresAt: null,
            applicationType: ApplicationType.DIRECT,
            experienceLevel: 'JUNIOR',
            employer: { id: 'emp-1' },
        };

        const mockProfile = {
            id: 'prof-1',
            firstName: 'John',
            lastName: 'Doe',
            profileCompletion: 100,
        };

        it('should successfully apply to a valid job', async () => {
            const seekerId = 'seeker-1';
            const dto = { resumeId: 'res-1' };

            prisma.job.findUnique.mockResolvedValue(mockJob as any);
            prisma.employerMember.findFirst.mockResolvedValue(null);
            applicationsRepository.findBySeekerAndJob.mockResolvedValue(null);
            prisma.jobSeekerProfile.findUnique.mockResolvedValue(mockProfile as any);
            prisma.resume.findFirst.mockResolvedValue({ id: 'res-1' } as any);
            
            const mockApplication = { id: 'app-1', status: ApplicationStatus.APPLIED };
            applicationsRepository.create.mockResolvedValue(mockApplication as any);

            const result = await service.apply(seekerId, 'job-1', dto as any);

            expect(result).toEqual(mockApplication);
            expect(applicationsRepository.create).toHaveBeenCalledWith({
                jobId: 'job-1',
                seekerId: 'seeker-1',
                resumeId: 'res-1',
                screeningAnswers: null,
            });
            expect(auditService.logAction).toHaveBeenCalled();
            expect(applicationsRepository.incrementJobApplicationCount).toHaveBeenCalledWith('job-1');
        });

        it('should throw ForbiddenException if employer tries to apply to own job', async () => {
            prisma.job.findUnique.mockResolvedValue(mockJob as any);
            prisma.employerMember.findFirst.mockResolvedValue({ userId: 'seeker-1' } as any);

            await expect(service.apply('seeker-1', 'job-1', {} as any)).rejects.toThrow(ForbiddenException);
            await expect(service.apply('seeker-1', 'job-1', {} as any)).rejects.toThrow(ApplicationErrorCodes.CANNOT_APPLY_OWN_JOB);
        });

        it('should throw BadRequestException if profile completion is too low', async () => {
            prisma.job.findUnique.mockResolvedValue(mockJob as any);
            prisma.employerMember.findFirst.mockResolvedValue(null);
            applicationsRepository.findBySeekerAndJob.mockResolvedValue(null);
            prisma.jobSeekerProfile.findUnique.mockResolvedValue({ ...mockProfile, profileCompletion: 20 } as any);

            await expect(service.apply('seeker-1', 'job-1', {} as any)).rejects.toThrow(BadRequestException);
            await expect(service.apply('seeker-1', 'job-1', {} as any)).rejects.toThrow(ApplicationErrorCodes.PROFILE_COMPLETION_TOO_LOW);
        });
        
        it('should throw BadRequestException if already applied', async () => {
            prisma.job.findUnique.mockResolvedValue(mockJob as any);
            prisma.employerMember.findFirst.mockResolvedValue(null);
            applicationsRepository.findBySeekerAndJob.mockResolvedValue({ id: 'app-1' } as any);

            await expect(service.apply('seeker-1', 'job-1', {} as any)).rejects.toThrow(BadRequestException);
            await expect(service.apply('seeker-1', 'job-1', {} as any)).rejects.toThrow(ApplicationErrorCodes.ALREADY_APPLIED);
        });
    });
});
