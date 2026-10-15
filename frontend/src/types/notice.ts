/** An access change near a business: what is affected and how to get around it. */
export interface AccessNotice {
    id: string;
    business: string;
    area: string;
    affected: string;
    alternative: string;
    /** ISO date the restriction is expected to end. */
    until: string;
    latitude: number;
    longitude: number;
}
