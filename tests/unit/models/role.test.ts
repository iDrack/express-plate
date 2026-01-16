import { describe, it, expect } from '@jest/globals';
import { Role, isRole, toRole } from '../../../src/models/role';

describe('Role enum', () => {
    describe('Role values', () => {
        it('should have ADMIN role', () => {
            expect(Role.ADMIN).toBe('ADMIN');
        });

        it('should have USER role', () => {
            expect(Role.USER).toBe('USER');
        });

        it('should have exactly 2 roles', () => {
            expect(Object.values(Role)).toHaveLength(2);
        });
    });

    describe('isRole', () => {
        it('should return true for valid ADMIN role', () => {
            expect(isRole('ADMIN')).toBe(true);
        });

        it('should return true for valid USER role', () => {
            expect(isRole('USER')).toBe(true);
        });

        it('should return false for invalid role', () => {
            expect(isRole('INVALID')).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(isRole('')).toBe(false);
        });

        it('should return false for lowercase role', () => {
            expect(isRole('admin')).toBe(false);
            expect(isRole('user')).toBe(false);
        });

        it('should return false for null or undefined', () => {
            expect(isRole(null as any)).toBe(false);
            expect(isRole(undefined as any)).toBe(false);
        });
    });

    describe('toRole', () => {
        it('should convert valid ADMIN string to Role.ADMIN', () => {
            expect(toRole('ADMIN')).toBe(Role.ADMIN);
        });

        it('should convert valid USER string to Role.USER', () => {
            expect(toRole('USER')).toBe(Role.USER);
        });

        it('should throw error for invalid role', () => {
            expect(() => toRole('INVALID')).toThrow('Unknown role : INVALID');
        });

        it('should throw error for empty string', () => {
            expect(() => toRole('')).toThrow('Unknown role : ');
        });

        it('should throw error for lowercase role', () => {
            expect(() => toRole('admin')).toThrow('Unknown role : admin');
            expect(() => toRole('user')).toThrow('Unknown role : user');
        });

        it('should throw error for null or undefined', () => {
            expect(() => toRole(null as any)).toThrow();
            expect(() => toRole(undefined as any)).toThrow();
        });
    });
});