/** Dummy list payload used by quotes list until wired to real API. */
export function getCrmQuotesListDummyFetchResult(): {
  data: Record<string, unknown>[];
  pagination: { total: number };
  metrics: Record<string, number | string>;
} {
  const dummyQuotes = [
    {
      id: 1,
      name: "John Smith",
      phone: "+1 555-0123",
      user_extension: "101",
      campaign_id: 1,
      is_viewed: true,
      created_at: "2026-02-15T10:30:00Z",
      updated_at: "2026-03-01T14:20:00Z",
      title: "Website Redesign Project",
      status: "Published",
      amount: 15000,
      view_count: 8,
      signing_status: "Pending",
      expiry_date: "2026-03-20T23:59:59Z",
      contact_name: "John Smith",
      contact_email: "john.smith@company.com",
      contact_phone: "+1 555-0123",
      description: "Complete website redesign with modern UI/UX",
      data: {
        email: "john.smith@company.com",
        contact_owner: "101",
      },
      campaign: {
        id: 1,
        name: "Q1 2026 Campaign",
      },
    },
    {
      id: 2,
      name: "Sarah Johnson",
      phone: "+1 555-0456",
      user_extension: "102",
      campaign_id: 2,
      is_viewed: true,
      created_at: "2026-01-20T09:15:00Z",
      updated_at: "2026-02-28T16:45:00Z",
      title: "Annual Software License",
      status: "Signed",
      amount: 28500,
      view_count: 12,
      signing_status: "Signed",
      expiry_date: "2026-03-10T23:59:59Z",
      contact_name: "Sarah Johnson",
      contact_email: "sarah.j@techcorp.com",
      contact_phone: "+1 555-0456",
      description: "Enterprise software license renewal",
      data: {
        email: "sarah.j@techcorp.com",
        contact_owner: "102",
      },
      campaign: {
        id: 2,
        name: "Enterprise Renewals",
      },
    },
    {
      id: 3,
      name: "Michael Brown",
      phone: "+1 555-0789",
      user_extension: "103",
      campaign_id: 3,
      is_viewed: false,
      created_at: "2026-03-01T11:00:00Z",
      updated_at: "2026-03-05T13:30:00Z",
      title: "Cloud Infrastructure Setup",
      status: "Draft",
      amount: 42000,
      view_count: 3,
      signing_status: "Viewed",
      expiry_date: "2026-03-25T23:59:59Z",
      contact_name: "Michael Brown",
      contact_email: "m.brown@startup.io",
      contact_phone: "+1 555-0789",
      description: "AWS cloud infrastructure setup and migration",
      data: {
        email: "m.brown@startup.io",
        contact_owner: "103",
      },
      campaign: {
        id: 3,
        name: "Cloud Services 2026",
      },
    },
  ];

  return {
    data: dummyQuotes,
    pagination: { total: 3 },
    metrics: {
      pending_count: 1,
      expiring_soon_count: 2,
      pending_approval_count: 0,
      total_value: 85500,
      signed_count: 1,
    },
  };
}
