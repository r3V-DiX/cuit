import { generateCompanyShortform, formatJobCode, resolveUniqueCompanyPrefix } from './job-code.util';

describe('job-code.util', () => {
    describe('generateCompanyShortform', () => {
        it('should generate initials for multi-word company names', () => {
            expect(generateCompanyShortform('Red Ventures')).toBe('RV');
            expect(generateCompanyShortform('Amazon Web Services')).toBe('AWS');
            expect(generateCompanyShortform('Tata Consultancy Services Limited')).toBe('TCSL');
        });

        it('should generate 3 letters for single-word company names >= 3 chars', () => {
            expect(generateCompanyShortform('Google')).toBe('GOO');
            expect(generateCompanyShortform('Cykruit')).toBe('CYK');
            expect(generateCompanyShortform('Meta')).toBe('MET');
        });

        it('should handle 1 or 2 letter company names', () => {
            expect(generateCompanyShortform('HP')).toBe('HP');
            expect(generateCompanyShortform('X')).toBe('X');
        });

        it('should handle special characters and punctuation gracefully', () => {
            expect(generateCompanyShortform('Acme, Inc.')).toBe('AI');
            expect(generateCompanyShortform('B&B Partners')).toBe('BBP');
        });

        it('should fallback to CYK for empty/invalid inputs', () => {
            expect(generateCompanyShortform('')).toBe('CYK');
            expect(generateCompanyShortform('   ')).toBe('CYK');
            expect(generateCompanyShortform(null as any)).toBe('CYK');
        });
    });

    describe('formatJobCode', () => {
        it('should format code with 4-digit zero-padding', () => {
            expect(formatJobCode('RV', 1)).toBe('RV-0001');
            expect(formatJobCode('RV', 42)).toBe('RV-0042');
            expect(formatJobCode('RV', 9999)).toBe('RV-9999');
            expect(formatJobCode('RV', 10000)).toBe('RV-10000');
        });
    });

    describe('resolveUniqueCompanyPrefix', () => {
        it('should use base prefix if not taken', async () => {
            const mockPrisma = {
                employer: {
                    findUnique: jest.fn().mockResolvedValue(null),
                },
            };

            const prefix = await resolveUniqueCompanyPrefix(mockPrisma, 'emp-1', 'Red Ventures');
            expect(prefix).toBe('RV');
        });

        it('should disambiguate with counter if prefix is taken by another employer', async () => {
            const mockPrisma = {
                employer: {
                    findUnique: jest
                        .fn()
                        .mockResolvedValueOnce({ id: 'other-emp' }) // RV taken
                        .mockResolvedValueOnce(null), // RV1 free
                },
            };

            const prefix = await resolveUniqueCompanyPrefix(mockPrisma, 'emp-1', 'Red Ventures');
            expect(prefix).toBe('RV1');
        });

        it('should reuse prefix if already taken by the same employer', async () => {
            const mockPrisma = {
                employer: {
                    findUnique: jest.fn().mockResolvedValue({ id: 'emp-1' }),
                },
            };

            const prefix = await resolveUniqueCompanyPrefix(mockPrisma, 'emp-1', 'Red Ventures');
            expect(prefix).toBe('RV');
        });
    });
});
