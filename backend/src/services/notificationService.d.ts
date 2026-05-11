type CampaignBrief = {
    title: string;
    description?: string | null;
};
export declare function sendEmailNotification(toEmail: string, customerName: string, billAmount: number, merchantName: string, campaigns?: CampaignBrief[]): Promise<boolean>;
export declare function sendNotification(toEmail: string, customerName: string, billAmount: number, merchantName: string, campaigns?: CampaignBrief[]): Promise<{
    email: boolean;
}>;
//# sourceMappingURL=notificationService.d.ts.map