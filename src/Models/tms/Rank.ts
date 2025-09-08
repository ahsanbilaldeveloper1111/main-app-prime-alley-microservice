import { Permission } from './Permission';

export interface Rank {
    id?: number;
    name: string;
    description: string;
    users_count?: number;
    permissions?: Permission[];
    created_at?: string;
    updated_at?: string;
}

export enum RankStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive'
}

export interface RankCreateData {
    name: string;
    description: string;
    
}

export interface RankUpdateData {
    name?: string;
    description?: string;

} 