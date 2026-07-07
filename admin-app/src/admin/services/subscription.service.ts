// admin-app/src/admin/services/subscription.service.ts
// Proxies all subscription operations to subscription-service (:4008).
// Admin-app does NOT own subscription data — it delegates to the dedicated service.

import { Injectable, BadGatewayException, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import {
    CreatePackageDto,
    UpdatePackageDto,
    AssignSubscriptionDto,
    SubscriptionListQueryDto,
} from '../dto/subscription.dto';

@Injectable()
export class SubscriptionService {
    private readonly baseUrl: string;

    constructor(
        private readonly http: HttpService,
        private readonly config: ConfigService,
    ) {
        this.baseUrl = this.config.get<string>('SUBSCRIPTION_SERVICE_URL') ?? 'http://localhost:4008';
    }

    private async proxy<T>(fn: () => Promise<{ data: T }>): Promise<T> {
        try {
            const res = await fn();
            return res.data;
        } catch (err) {
            const axiosErr = err as AxiosError;
            if (axiosErr.response) {
                // Forward the upstream error response verbatim
                const status = axiosErr.response.status;
                const data = axiosErr.response.data as any;
                const message = data?.message ?? 'Subscription service error';
                throw new HttpException(message, status);
            }
            throw new BadGatewayException('Subscription service unavailable');
        }
    }

    // ── Packages ──────────────────────────────────────────────────────────────

    async listPackages(query: { isActive?: boolean; page?: number; limit?: number } = {}) {
        return this.proxy(() =>
            firstValueFrom(this.http.get(`${this.baseUrl}/packages`, { params: query })),
        );
    }

    async getPackage(id: string) {
        return this.proxy(() =>
            firstValueFrom(this.http.get(`${this.baseUrl}/packages/${id}`)),
        );
    }

    async createPackage(dto: CreatePackageDto) {
        return this.proxy(() =>
            firstValueFrom(this.http.post(`${this.baseUrl}/admin/packages`, dto)),
        );
    }

    async updatePackage(id: string, dto: UpdatePackageDto) {
        return this.proxy(() =>
            firstValueFrom(this.http.patch(`${this.baseUrl}/admin/packages/${id}`, dto)),
        );
    }

    async deletePackage(id: string) {
        return this.proxy(() =>
            firstValueFrom(this.http.delete(`${this.baseUrl}/admin/packages/${id}`)),
        );
    }

    // ── Employer subscriptions ────────────────────────────────────────────────

    async listSubscriptions(query: SubscriptionListQueryDto) {
        return this.proxy(() =>
            firstValueFrom(this.http.get(`${this.baseUrl}/admin/subscriptions`, { params: query })),
        );
    }

    async getSubscriptionById(id: string) {
        return this.proxy(() =>
            firstValueFrom(this.http.get(`${this.baseUrl}/admin/subscriptions/${id}`)),
        );
    }

    async assignSubscription(dto: AssignSubscriptionDto) {
        return this.proxy(() =>
            firstValueFrom(this.http.post(`${this.baseUrl}/admin/subscriptions/assign`, dto)),
        );
    }

    async getEmployerSubscription(employerId: string) {
        return this.proxy(() =>
            firstValueFrom(this.http.get(`${this.baseUrl}/admin/subscriptions/employer/${employerId}`)),
        );
    }

    async updateSubscriptionStatus(id: string, status: string) {
        return this.proxy(() =>
            firstValueFrom(
                this.http.patch(`${this.baseUrl}/admin/subscriptions/${id}/status`, { status }),
            ),
        );
    }
}
