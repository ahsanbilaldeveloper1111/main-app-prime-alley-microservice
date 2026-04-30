import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useMemo, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/css/GenericTable.css";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import { normalizeSearchQuery } from "@utils/Helper";
import GenericTable, { TableColumn } from "@components/GenericTable";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const FAQ_DATA: FAQItem[] = [
  {
    id: "1",
    category: "Account Management",
    question: "How do I access my account settings?",
    answer:
      "You can access your account settings by clicking on your profile icon in the top-right corner of the dashboard, then selecting 'Account Settings' from the dropdown menu. From there, you can update your personal information, change your password, and manage your preferences.",
  },
  {
    id: "2",
    category: "Account Management",
    question: "What should I do if I forget my password?",
    answer:
      "If you forget your password, click on the 'Forgot Password' link on the login page. Enter your email address and you'll receive instructions to reset your password. Make sure to check your spam folder if you don't see the email in your inbox.",
  },
  {
    id: "3",
    category: "Support",
    question: "How can I contact customer support?",
    answer:
      "You can contact our customer support team through multiple channels: 1) Use the support ticket system within the application, 2) Send an email to support@company.com, or 3) Call our support hotline at 1-800-SUPPORT during business hours (9 AM - 6 PM EST, Monday-Friday).",
  },
  {
    id: "4",
    category: "Security",
    question: "Is my data secure and encrypted?",
    answer:
      "Yes, we take data security very seriously. All data is encrypted both in transit and at rest using industry-standard encryption protocols. We also implement regular security audits and comply with relevant data protection regulations to ensure your information remains safe.",
  },
  {
    id: "5",
    category: "Data Management",
    question: "How do I export my data?",
    answer:
      "To export your data, navigate to the 'Data Export' section in your account settings. You can choose to export specific data types or all your data. The export will be generated and sent to your registered email address as a secure download link within 24 hours.",
  },
  {
    id: "6",
    category: "Technical",
    question: "What are the system requirements?",
    answer:
      "Our application works on all modern web browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for the best experience. The application is also mobile-responsive and works on tablets and smartphones.",
  },
  {
    id: "7",
    category: "Billing",
    question: "How do I update my billing information?",
    answer:
      "To update your billing information, go to the 'Billing' section in your account settings. You can update your payment method, billing address, and view your billing history. All changes are saved immediately and will apply to your next billing cycle.",
  },
  {
    id: "8",
    category: "Customization",
    question: "Can I customize the dashboard layout?",
    answer:
      "Yes, you can customize your dashboard by clicking the 'Customize' button in the top-right corner of the dashboard. You can drag and drop widgets, resize them, and arrange them according to your preferences. Your layout will be saved automatically.",
  },
  {
    id: "9",
    category: "Features",
    question: "How do I enable two-factor authentication?",
    answer:
      "To enable two-factor authentication, go to your Account Settings > Security tab. Click on 'Enable 2FA' and follow the setup instructions. You'll need to scan a QR code with an authenticator app like Google Authenticator or Authy.",
  },
  {
    id: "10",
    category: "Troubleshooting",
    question: "Why am I experiencing slow performance?",
    answer:
      "Slow performance can be caused by several factors: 1) Check your internet connection, 2) Clear your browser cache and cookies, 3) Close unnecessary browser tabs, 4) Try using a different browser. If issues persist, contact our support team.",
  },
];

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const COLUMNS: TableColumn<FAQItem>[] = [
  {
    key: "category",
    label: "Category",
    sortable: true,
    width: "160px",
    render: (row) => (
      <span className="status-badge primary">{row.category}</span>
    ),
  },
  {
    key: "question",
    label: "Question",
    sortable: true,
    width: "35%",
    render: (row) => (
      <span style={{ fontWeight: 500, color: "#141414" }}>{row.question}</span>
    ),
  },
  {
    key: "answer",
    label: "Answer",
    sortable: false,
    render: (row) => (
      <span className="text-muted" style={{ fontSize: "0.9rem" }}>
        {row.answer}
      </span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Filter pill categories
// ---------------------------------------------------------------------------

const ALL_CATEGORIES = Array.from(new Set(FAQ_DATA.map((f) => f.category)));

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const FAQ = () => {
  const [searchValue, setSearchValue] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setActiveCategory(null);
  }, []);

  const handleCategoryFilter = useCallback(
    (category: string) => {
      if (activeCategory === category) {
        setActiveCategory(null);
        setSearchValue("");
      } else {
        setActiveCategory(category);
        setSearchValue(category);
      }
    },
    [activeCategory],
  );

  const handleClearCategory = useCallback(() => {
    setActiveCategory(null);
    setSearchValue("");
  }, []);

  const filteredData = useMemo(() => {
    const q = normalizeSearchQuery(searchValue);
    if (!q) return FAQ_DATA;
    return FAQ_DATA.filter(
      (faq) =>
        faq.question.toLowerCase().includes(q.toLowerCase()) ||
        faq.answer.toLowerCase().includes(q.toLowerCase()) ||
        faq.category.toLowerCase().includes(q.toLowerCase()),
    );
  }, [searchValue]);

  const filterPills = useMemo(
    () =>
      ALL_CATEGORIES.map((category) => ({
        id: category,
        label: category,
        active: activeCategory === category,
        onClick: () => handleCategoryFilter(category),
        onClear: () => handleClearCategory(),
      })),
    [activeCategory, handleCategoryFilter, handleClearCategory],
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Resources"
        mainLink="/resources"
        subTitle="FAQ"
      />

      <PageHeader title="Frequently Asked Questions" leftGrid={12} />

      <div className="mt-4">
        <GenericTable<FAQItem>
          data={filteredData}
          columns={COLUMNS}
          showActions={false}
          loading={false}
          emptyMessage={
            <div className="text-center py-5">
              <i className="fas fa-search text-muted fs-1 mb-3"></i>
              <h5 className="text-muted">No FAQs found</h5>
              <p className="text-muted">
                Try adjusting your search terms or browse by category.
              </p>
            </div>
          }
          sortable={true}
          showToolbar={true}
          toolbar={{
            showSearch: true,
            searchValue,
            searchPlaceholder: "Search FAQs...",
            onSearchChange: handleSearchChange,
            showFilterPills: true,
            filterPills,
            showMoreFiltersButton: false,
          }}
          uniqueKey="id"
          hover={true}
          showToolbarActions={false}
        />
      </div>
    </React.Fragment>
  );
};

FAQ.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default FAQ;
