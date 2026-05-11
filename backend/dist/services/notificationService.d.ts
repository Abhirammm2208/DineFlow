type CampaignBrief = {
    title: string;
    description?: string | null;
};
export declare function sendEmailNotification(toEmail: string, customerName: string, billAmount: number, merchantName: string, campaigns?: CampaignBrief[]): Promise<boolean>;
export declare function sendNotification(toEmail: string, customerName: string, billAmount: number, merchantName: string, campaigns?: CampaignBrief[]): Promise<{
    email: boolean;
}>;
export {};
//# sourceMappingURL=notificationService.d.ts.map