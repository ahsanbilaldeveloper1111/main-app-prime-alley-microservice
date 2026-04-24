import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import React, { ReactElement, useState, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import FormModal from "@pages/partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import GenericTable, { TableColumn } from "@components/GenericTable";

import { getTrunksInbound } from "@utils/ai-agent/inbound";
import { Phone } from "lucide-react";

interface Trunk {
  sip_trunk_id: string;
  name: string;
  address: string;
  numbers: string[];
}

const normalizeTrunkList = (items: Trunk[]) =>
  items.map((trunk) => ({
    ...trunk,
    numbers: Array.isArray(trunk.numbers) ? trunk.numbers : [],
  }));

const columns: TableColumn<Trunk>[] = [
  {
    key: "sip_trunk_id",
    label: "Trunk ID",
    type: "text",
  },
  {
    key: "name",
    label: "Name",
    render: (row: Trunk) => (
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #667eea 0%, #667eea 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Phone size={18} color="white" />
        </div>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937" }}>
          {row.name}
        </span>
      </div>
    ),
  },
  {
    key: "address",
    label: "Address",
    render: (row: Trunk) => (
      <span style={{ fontFamily: "monospace", fontSize: "14px", color: "#1f2937" }}>
        {row.address}
      </span>
    ),
  },
  {
    key: "numbers",
    label: "Numbers",
    render: (row: Trunk) => (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {row.numbers && row.numbers.length > 0 ? (
          <>
            {row.numbers.slice(0, 3).map((num) => (
              <span
                key={`${row.sip_trunk_id}-${num}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                  backgroundColor: "#f3f4f6",
                  color: "#6b7280",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                {num}
              </span>
            ))}
            {row.numbers.length > 3 && (
              <span
                style={{ color: "#6b7280", fontSize: "12px", padding: "4px 8px" }}
              >
                +{row.numbers.length - 3} more
              </span>
            )}
          </>
        ) : (
          <span style={{ color: "#9ca3af", fontSize: "13px" }}>No numbers</span>
        )}
      </div>
    ),
  },
];

const AIMLTrunkProfile = () => {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [trunks, setTrunks] = useState<Trunk[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Modal states
  const [showAddTrunkModal, setShowAddTrunkModal] = useState<boolean>(false);
  const [showEditTrunkModal, setShowEditTrunkModal] = useState<boolean>(false);
  const [showDeleteTrunkModal, setShowDeleteTrunkModal] = useState<boolean>(false);
  const [selectedTrunk, setSelectedTrunk] = useState<Trunk | null>(null);

  // Form states
  const [newTrunkName, setNewTrunkName] = useState<string>("");
  const [newTrunkAddress, setNewTrunkAddress] = useState<string>("");
  const [newTrunkNumbers, setNewTrunkNumbers] = useState<string>("");

  // Fetch trunks
  const fetchTrunks = useCallback(async () => {
    try {
      // const response = await axiosInstance.get('aiml/list-trunks');
      const response = await getTrunksInbound();
      console.log("getTrunksInbound response:", response?.data);
      const received = normalizeTrunkList(response?.data?.trunks ?? []);
      setTrunks(received);
    } catch (error) {
      console.error("Error fetching trunks:", error);
      toast.error("Failed to fetch trunks");
    }
  }, []);

  // Load trunks on mount and on refresh
  React.useEffect(() => {
    fetchTrunks();
  }, [fetchTrunks, refreshKey]);

  // Filter trunks (guard against undefined name/address/numbers)
  const filteredTrunks = trunks.filter((trunk) => {
    const name = (trunk.name ?? "").toString().toLowerCase();
    const address = (trunk.address ?? "").toString().toLowerCase();
    const numbers = Array.isArray(trunk.numbers) ? trunk.numbers : [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      name.includes(q) ||
      address.includes(q) ||
      numbers.some((num) => (num ?? "").toString().toLowerCase().includes(q))
    );
  });

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Trunk Profiles" />

      <GenericTable<Trunk>
        data={filteredTrunks}
        columns={columns}
        showToolbarActions={false}
        uniqueKey="sip_trunk_id"
        showToolbar
        toolbar={{
          showSearch: true,
          searchValue: searchQuery,
          searchPlaceholder: "Search trunks...",
          onSearchChange: (value) => setSearchQuery(value),
        }}
        emptyMessage={
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Phone size={48} color="#d1d5db" style={{ marginBottom: "16px" }} />
            <p style={{ fontSize: "16px", color: "#6b7280", margin: 0 }}>
              No trunks found matching your criteria
            </p>
          </div>
        }
        hover
        showActions={false}
      />
    </React.Fragment>
  );
};

AIMLTrunkProfile.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AIMLTrunkProfile;
