/**
 * Transportation Service Management — Modern Restyle (JS)
 * - Brand: #3B5787 / #67BAE0
 * - Mobile-first, glass gradient header, sticky toolbar
 * - Manage tab: search, status filter, sort, client-side pagination
 * - Cards with hover lift, soft shadows, chips, and modern empty states
 */

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import apiClient from "../../services/api.service";

// ---------------- Icons (emoji: no extra deps) ----------------
const Icon = ({ type, className = "" }) => {
  const icons = {
    plus: "➕",
    edit: "✏️",
    trash: "🗑️",
    save: "💾",
    times: "✕",
    car: "🚗",
    taxi: "🚕",
    suv: "🚙",
    van: "🚐",
    luxury: "🏎️",
    eco: "🌱",
    wheelchair: "♿",
    info: "ℹ️",
    search: "🔎",
    filter: "🧭",
    sort: "↕️",
    list: "📋",
    toggle: "🔘",
    stats: "📈"
  };
  return <span className={className}>{icons[type] || "❓"}</span>;
};

// ---------------- UI tokens ----------------
const BTN = {
  primary:
    "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white " +
    "bg-gradient-to-r from-[#3B5787] to-[#67BAE0] hover:from-[#2A4A6B] hover:to-[#5BA8CC] " +
    "shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B5787]",
  ghost:
    "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-[#3B5787] border border-gray-200 " +
    "bg-white/70 hover:bg-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B5787]",
  warn:
    "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white " +
    "bg-orange-600 hover:bg-orange-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500",
  success:
    "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white " +
    "bg-green-600 hover:bg-green-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500",
  danger:
    "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white " +
    "bg-red-600 hover:bg-red-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500",
};

const INPUT =
  "w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0]";

const CARD =
  "rounded-2xl border border-gray-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 " +
  "shadow-sm hover:shadow-md transition-shadow";

// ---------------- Component ----------------
const TransportationServiceCreator = () => {
  const { t } = useTranslation();

  // Tabs
  const [activeTab, setActiveTab] = useState("manage");

  // Common
  const [loading, setLoading] = useState(false);
  const [categoryTemplate, setCategoryTemplate] = useState(null);

  // Manage
  const [existingServices, setExistingServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [editFormData, setEditFormData] = useState(null);

  // UX: search/filter/sort/pagination
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive
  const [sortKey, setSortKey] = useState("name"); // name | bookings | revenue | updated
  const [sortDir, setSortDir] = useState("desc"); // asc | desc
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Create
  const [serviceDetails, setServiceDetails] = useState({
    name: "",
    description: "",
    shortDescription: "",
    isActive: true,
  });
  const [transportationItems, setTransportationItems] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);

  useEffect(() => {
    fetchCategoryTemplate();
    if (activeTab === "manage") fetchExistingServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ---------------- API ----------------
  const fetchExistingServices = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/service/services?category=transportation");
      let services = [];
      if (response.data?.data?.services) services = response.data.data.services;
      else if (response.data?.services) services = response.data.services;
      else if (Array.isArray(response.data?.data)) services = response.data.data;
      else if (Array.isArray(response.data)) services = response.data;
      setExistingServices(services || []);
    } catch (error) {
      console.error(error);
      toast.error(t("serviceProvider.transportation.services.messages.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceAvailability = async (serviceId, currentStatus) => {
    try {
      await apiClient.patch(`/service/services/${serviceId}`, { isActive: !currentStatus });
      setExistingServices((prev) =>
        prev.map((s) => (s._id === serviceId ? { ...s, isActive: !currentStatus } : s))
      );
      toast.success(
        t(
          `serviceProvider.transportation.services.messages.service${
            !currentStatus ? "Activated" : "Deactivated"
          }`
        )
      );
    } catch (error) {
      console.error(error);
      toast.error(t("serviceProvider.transportation.services.messages.statusUpdateFailed"));
    }
  };

  const startEditingService = (service) => {
    setEditingService(service._id);
    setEditFormData({
      name: service.name,
      description: service.description,
      transportationItems: service.transportationItems || [],
    });
  };
  const cancelEditing = () => {
    setEditingService(null);
    setEditFormData(null);
  };
  const saveEditedService = async (serviceId) => {
    try {
      setLoading(true);
      await apiClient.put(`/service/services/${serviceId}`, {
        name: editFormData.name,
        description: editFormData.description,
        transportationItems: editFormData.transportationItems,
        category: "transportation",
      });
      toast.success(t("serviceProvider.transportation.services.messages.serviceUpdated"));
      setEditingService(null);
      setEditFormData(null);
      fetchExistingServices();
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          t("serviceProvider.transportation.services.messages.updateFailed")
      );
    } finally {
      setLoading(false);
    }
  };
  const deleteService = async (serviceId) => {
    if (!window.confirm(t("serviceProvider.transportation.services.messages.confirmDeleteService")))
      return;
    try {
      await apiClient.delete(`/service/services/${serviceId}`);
      setExistingServices((prev) => prev.filter((s) => s._id !== serviceId));
      toast.success(t("serviceProvider.transportation.services.messages.serviceDeleted"));
    } catch (error) {
      console.error(error);
      toast.error(t("serviceProvider.transportation.services.messages.deleteFailed"));
    }
  };

  const fetchCategoryTemplate = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/service/category-templates/transportation");
      const template = response.data?.data?.template;
      setCategoryTemplate(template);
      setAvailableVehicles(template?.vehicleTypes || []);
    } catch (error) {
      console.error(error);
      toast.error(t("serviceProvider.transportation.services.messages.templateLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Create helpers ----------------
  const addVehicleFromDropdown = (vehicleTypeId) => {
    if (!vehicleTypeId) return;
    const vehicleTemplate = availableVehicles.find((v) => v.id === vehicleTypeId);
    if (!vehicleTemplate) return;
    if (transportationItems.some((item) => item.vehicleType === vehicleTypeId)) {
      toast.error(t("serviceProvider.transportation.services.messages.vehicleAlreadyAdded"));
      return;
    }
    const serviceTypes = (categoryTemplate?.serviceTypes || []).map((st) => ({
      serviceTypeId: st.id,
      name: st.name,
      description: st.description,
      pricingModel: st.pricingModel,
      availability: {
        days: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
        hours: { start: "06:00", end: "23:00" },
      },
      advanceBooking: {
        required: st.advanceRequired || false,
        minimumHours: st.minimumHours || 0,
        maximumDays: 30,
      },
      isPopular: st.isPopular || false,
      isAvailable: true,
    }));
    const newVehicleItem = {
      vehicleType: vehicleTypeId,
      name: vehicleTemplate.name,
      description: vehicleTemplate.description,
      capacity: vehicleTemplate.capacity,
      features: vehicleTemplate.features,
      isAvailable: true,
      serviceTypes,
      notes: "",
      dateAdded: new Date(),
    };
    setTransportationItems((prev) => [...prev, newVehicleItem]);
    toast.success(
      `${vehicleTemplate.name} ${t(
        "serviceProvider.transportation.services.messages.vehicleAddedSuccessfully"
      )}`
    );
  };
  const removeTransportationItem = (index) =>
    setTransportationItems((prev) => prev.filter((_, i) => i !== index));
  const toggleItemServiceTypeAvailability = (itemIndex, serviceTypeId, isAvailable) => {
    setTransportationItems((prev) =>
      prev.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              serviceTypes: item.serviceTypes.map((st) =>
                st.serviceTypeId === serviceTypeId ? { ...st, isAvailable } : st
              ),
            }
          : item
      )
    );
  };

  // ---------------- Validation & Create ----------------
  const validateForm = () => {
    if (!serviceDetails.name.trim()) {
      toast.error(t("serviceProvider.transportation.services.messages.serviceNameRequired"));
      return false;
    }
    if (!serviceDetails.description.trim()) {
      toast.error(t("serviceProvider.transportation.services.messages.descriptionRequired"));
      return false;
    }
    if (transportationItems.length === 0) {
      toast.error(t("serviceProvider.transportation.services.messages.addAtLeastOneVehicle"));
      return false;
    }
    const hasAvailableServices = transportationItems.some(
      (it) => it.isAvailable && it.serviceTypes.some((st) => st.isAvailable)
    );
    if (!hasAvailableServices) {
      toast.error(t("serviceProvider.transportation.services.messages.enableAtLeastOneService"));
      return false;
    }
    return true;
  };
  const createService = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      const serviceData = {
        ...serviceDetails,
        category: "transportation",
        subcategory: "vehicle_based",
        serviceType: "transportation_vehicles",
        transportationItems,
        pricing: { basePrice: 0, pricingType: "quote-based", currency: "USD" },
        isActive: true,
      };
      await apiClient.post("/service/categories/transportation/vehicles", serviceData);
      toast.success(
        t("serviceProvider.transportation.services.messages.quoteServiceCreatedSuccessfully")
      );
      setServiceDetails({ name: "", description: "", shortDescription: "", isActive: true });
      setTransportationItems([]);
      setActiveTab("manage");
      fetchExistingServices();
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          t("serviceProvider.transportation.services.messages.failedToCreateService")
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Manage: derived list (search/filter/sort/paginate) ----------------
  const filteredSorted = useMemo(() => {
    let data = [...existingServices];

    // search
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter((s) => {
        const name = (s.name || "").toLowerCase();
        const desc = (s.description || "").toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    }

    // status filter
    if (statusFilter !== "all") {
      const active = statusFilter === "active";
      data = data.filter((s) => !!s.isActive === active);
    }

    // sorting keys
    const getMetric = (s, key) => {
      if (key === "bookings") return s?.performance?.totalBookings || 0;
      if (key === "revenue") return s?.performance?.totalRevenue || 0;
      if (key === "updated") return new Date(s?.updatedAt || s?.createdAt || 0).getTime();
      if (key === "name") return (s?.name || "").toLowerCase();
      return 0;
    };

    data.sort((a, b) => {
      const va = getMetric(a, sortKey);
      const vb = getMetric(b, sortKey);
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [existingServices, query, statusFilter, sortKey, sortDir]);

  const total = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageData = filteredSorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    // reset to first page when filters change
    setPage(1);
  }, [query, statusFilter, sortKey, sortDir, pageSize]);

  // ---------------- UI helpers ----------------
  const getVehicleIcon = (vehicleType) => {
    const iconMap = {
      economy_sedan: "car",
      comfort_sedan: "car",
      premium_suv: "suv",
      luxury_vehicle: "luxury",
      eco_vehicle: "eco",
      accessible_vehicle: "wheelchair",
      van_large: "van",
      local_taxi: "taxi",
      shared_ride: "car",
    };
    return iconMap[vehicleType] || "car";
  };

  // ---------------- Render ----------------
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Glass Gradient Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3B5787] via-[#4D6EA0] to-[#67BAE0] text-white shadow-2xl mb-6">
        <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

        <div className="relative p-6 sm:p-10">
          <div className="flex items-center gap-3 text-white/90">
            <Icon type="list" />
            <span className="uppercase tracking-wider text-xs font-semibold">
              {t("serviceProvider.transportation.services.manageTitle") || "Transportation"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold leading-tight">
            Build & Operate Transportation Services
          </h1>
          <p className="mt-2 sm:mt-3 text-white/85 max-w-2xl">
            Create vehicle offerings, enable service types, and keep your catalog sharp.
          </p>

          {/* Tabs */}
          <div className="mt-6 inline-flex rounded-2xl border border-white/20 bg-white/10 backdrop-blur shadow-sm">
            <button
              onClick={() => setActiveTab("manage")}
              className={
                "px-4 sm:px-6 py-2 rounded-2xl text-sm font-semibold transition " +
                (activeTab === "manage"
                  ? "bg-white text-[#3B5787]"
                  : "text-white/90 hover:bg-white/20")
              }
            >
              Manage
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className={
                "px-4 sm:px-6 py-2 rounded-2xl text-sm font-semibold transition " +
                (activeTab === "add"
                  ? "bg-white text-[#3B5787]"
                  : "text-white/90 hover:bg-white/20")
              }
            >
              Add New
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Toolbar (Manage only) */}
      {activeTab === "manage" && (
        <div className="sticky top-0 z-20 mb-5">
          <div className={CARD + " p-3 sm:p-4"}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <Icon type="search" />
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or description…"
                  className={INPUT + " pl-9"}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 shrink-0">
                  <Icon type="filter" className="mr-1" />
                  Status
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={INPUT}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 shrink-0">
                  <Icon type="sort" className="mr-1" />
                  Sort
                </span>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className={INPUT}
                >
                  <option value="updated">Recently Updated</option>
                  <option value="name">Name</option>
                  <option value="bookings">Bookings</option>
                  <option value="revenue">Revenue</option>
                </select>
                <button
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  className={BTN.ghost + " shrink-0"}
                  title="Toggle sort direction"
                >
                  {sortDir === "asc" ? "↑" : "↓"}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-[#3B5787] font-semibold">
                  <Icon type="stats" className="mr-1" />
                  {total} results
                </div>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className={INPUT + " w-28"}
                  title="Page size"
                >
                  <option value={4}>4 / page</option>
                  <option value={6}>6 / page</option>
                  <option value={8}>8 / page</option>
                  <option value={12}>12 / page</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === "manage" ? (
        <ManageTab
          loading={loading}
          pageData={pageData}
          totalPages={totalPages}
          page={currentPage}
          setPage={setPage}
          startEditingService={startEditingService}
          editingService={editingService}
          editFormData={editFormData}
          setEditFormData={setEditFormData}
          saveEditedService={saveEditedService}
          cancelEditing={cancelEditing}
          toggleServiceAvailability={toggleServiceAvailability}
          deleteService={deleteService}
          getVehicleIcon={getVehicleIcon}
        />
      ) : (
        <AddTab
          loading={loading}
          categoryTemplate={categoryTemplate}
          serviceDetails={serviceDetails}
          setServiceDetails={setServiceDetails}
          availableVehicles={availableVehicles}
          addVehicleFromDropdown={addVehicleFromDropdown}
          transportationItems={transportationItems}
          removeTransportationItem={removeTransportationItem}
          toggleItemServiceTypeAvailability={toggleItemServiceTypeAvailability}
          getVehicleIcon={getVehicleIcon}
          createService={createService}
        />
      )}
    </div>
  );
};

// ---------------- Manage Tab ----------------
const ManageTab = ({
  loading,
  pageData,
  totalPages,
  page,
  setPage,
  startEditingService,
  editingService,
  editFormData,
  setEditFormData,
  saveEditedService,
  cancelEditing,
  toggleServiceAvailability,
  deleteService,
  getVehicleIcon,
}) => {
  const { t } = useTranslation();

  const Skeleton = () => (
    <div className={CARD + " p-5 animate-pulse"}>
      <div className="h-5 w-1/3 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-2/3 bg-gray-200 rounded mb-4" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    </div>
  );

  if (loading && pageData.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }

  if (pageData.length === 0) {
    return (
      <div className={CARD + " p-10 text-center"}>
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gradient-to-br from-[#3B5787]/10 to-[#67BAE0]/10 flex items-center justify-center">
          <span className="text-2xl">🚗</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          {t("serviceProvider.transportation.services.noServicesFound")}
        </h3>
        <p className="text-gray-500 mt-1">
          {t("serviceProvider.transportation.services.noServicesDescription") ||
            "Nothing to show just yet."}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {pageData.map((service) => (
          <div
            key={service._id}
            className={
              CARD +
              " p-5 hover:-translate-y-0.5 transition-transform duration-150 border border-gray-100"
            }
          >
            {editingService === service._id ? (
              // ------------ Edit Mode ------------
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("serviceProvider.transportation.services.serviceName")}
                  </label>
                  <input
                    className={INPUT}
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("serviceProvider.transportation.services.description")}
                  </label>
                  <textarea
                    rows={3}
                    className={INPUT}
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData((p) => ({ ...p, description: e.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => saveEditedService(service._id)}
                    className={BTN.success}
                  >
                    <Icon type="save" />
                    {t("serviceProvider.transportation.services.save")}
                  </button>
                  <button onClick={cancelEditing} className={BTN.ghost}>
                    <Icon type="times" />
                    {t("common.cancel") || "Cancel"}
                  </button>
                </div>
              </div>
            ) : (
              // ------------ View Mode ------------
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{service.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                  </div>
                  <span
                    className={
                      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium " +
                      (service.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800")
                    }
                  >
                    {service.isActive ? t("common.active") || "Active" : t("common.inactive") || "Inactive"}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 rounded-xl border border-[#67BAE0]/20 bg-gradient-to-r from-[#3B5787]/5 to-[#67BAE0]/5 p-3">
                  <Metric
                    label={t("serviceProvider.transportation.services.vehicleTypes")}
                    value={service.transportationItems?.length || 0}
                  />
                  <Metric
                    label={t("serviceProvider.transportation.services.bookings")}
                    value={service?.performance?.totalBookings || 0}
                  />
                  <Metric
                    label={t("serviceProvider.transportation.services.revenue")}
                    value={`$${service?.performance?.totalRevenue || 0}`}
                  />
                </div>

                {/* Vehicle chips */}
                {service.transportationItems?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {service.transportationItems.map((v, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-800 border border-blue-100"
                      >
                        <Icon type={getVehicleIcon(v.vehicleType)} />
                        {v.name}
                        {v?.capacity?.passengers != null && (
                          <span className="text-blue-600">({v.capacity.passengers}p)</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => startEditingService(service)} className={BTN.primary}>
                    <Icon type="edit" />
                    {t("common.edit") || "Edit"}
                  </button>
                  <button
                    onClick={() => toggleServiceAvailability(service._id, service.isActive)}
                    className={service.isActive ? BTN.warn : BTN.success}
                  >
                    <Icon type="toggle" />
                    {service.isActive ? t("common.deactivate") || "Deactivate" : t("common.activate") || "Activate"}
                  </button>
                  <button onClick={() => deleteService(service._id)} className={BTN.danger}>
                    <Icon type="trash" />
                    {t("common.delete") || "Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className={BTN.ghost}
          disabled={page <= 1}
        >
          ← Prev
        </button>
        <span className="text-sm text-gray-700">
          Page <strong>{page}</strong> of <strong>{totalPages}</strong>
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className={BTN.ghost}
          disabled={page >= totalPages}
        >
          Next →
        </button>
      </div>
    </>
  );
};

const Metric = ({ label, value }) => (
  <div className="text-center">
    <div className="text-base sm:text-lg font-semibold text-[#3B5787]">{value}</div>
    <div className="text-[11px] sm:text-xs text-gray-600">{label}</div>
  </div>
);

// ---------------- Add Tab ----------------
const AddTab = ({
  loading,
  categoryTemplate,
  serviceDetails,
  setServiceDetails,
  availableVehicles,
  addVehicleFromDropdown,
  transportationItems,
  removeTransportationItem,
  toggleItemServiceTypeAvailability,
  getVehicleIcon,
  createService,
}) => {
  const { t } = useTranslation();

  if (loading && !categoryTemplate) {
    return (
      <div className={CARD + " p-6 flex items-center justify-center text-[#3B5787]"}>
        <div className="animate-spin h-5 w-5 border-2 border-[#67BAE0] border-t-transparent rounded-full mr-3" />
        <span>{t("serviceProvider.transportation.services.messages.loadingServices") || "Loading..."}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Information */}
      <div className={CARD + " p-5 sm:p-6"}>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
          {t("serviceProvider.transportation.services.createTitle")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label={t("serviceProvider.transportation.services.serviceNameRequired")}
            value={serviceDetails.name}
            onChange={(v) => setServiceDetails((p) => ({ ...p, name: v }))}
            placeholder={t("serviceProvider.transportation.services.serviceNamePlaceholder")}
          />
          <Field
            label={t("serviceProvider.transportation.services.shortDescription")}
            value={serviceDetails.shortDescription}
            onChange={(v) => setServiceDetails((p) => ({ ...p, shortDescription: v }))}
            placeholder={t("serviceProvider.transportation.services.shortDescriptionPlaceholder")}
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("serviceProvider.transportation.services.descriptionRequired")}
          </label>
          <textarea
            rows={3}
            className={INPUT}
            value={serviceDetails.description}
            onChange={(e) => setServiceDetails((p) => ({ ...p, description: e.target.value }))}
            placeholder={t("serviceProvider.transportation.services.descriptionPlaceholder")}
          />
        </div>
      </div>

      {/* Vehicle Types */}
      <div className={CARD + " p-5 sm:p-6"}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h4 className="text-lg font-semibold text-gray-800">
            {t("serviceProvider.transportation.services.availableVehicleTypes")}
          </h4>
          <select
            onChange={(e) => addVehicleFromDropdown(e.target.value)}
            className={INPUT + " sm:w-80"}
            value=""
          >
            <option value="">{t("serviceProvider.transportation.services.addVehicleType")}</option>
            {availableVehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {t(`transportation.vehicleTypes.${v.id}`)}{" "}
                ({typeof v.capacity === "object" ? v.capacity.passengers : v.capacity}{" "}
                {t("serviceProvider.transportation.services.passengers")})
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 mb-4">
          <div className="flex items-center gap-2 text-blue-900 font-medium">
            <Icon type="info" /> {t("serviceProvider.transportation.services.quoteBased")}
          </div>
          <p className="text-sm text-blue-800 mt-1">
            {t("serviceProvider.transportation.services.quoteBasedDescription")}
          </p>
        </div>

        {transportationItems.length > 0 ? (
          <div className="space-y-4">
            {transportationItems.map((vehicle, idx) => (
              <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">
                      <Icon type={getVehicleIcon(vehicle.vehicleType)} />
                    </span>
                    <div>
                      <h5 className="font-semibold text-gray-900">{vehicle.name}</h5>
                      <p className="text-sm text-gray-600">{vehicle.description}</p>
                      <p className="text-xs text-[#3B5787] mt-1">
                        {t("serviceProvider.transportation.services.capacity") || "Capacity"}:{" "}
                        {vehicle?.capacity?.passengers}{" "}
                        {t("serviceProvider.transportation.services.passengers")}
                        {vehicle?.capacity?.luggage != null &&
                          `, ${vehicle.capacity.luggage} ${t("serviceProvider.transportation.services.luggage") || "luggage"}`}
                      </p>
                      {Array.isArray(vehicle.features) && vehicle.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {vehicle.features.map((f, i) => (
                            <span key={i} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeTransportationItem(idx)}
                    className="text-red-600 hover:text-red-800"
                    title={t("common.remove") || "Remove"}
                  >
                    <Icon type="trash" className="text-xl" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {vehicle.serviceTypes.map((st, sIdx) => (
                    <div key={sIdx} className="rounded-xl border border-gray-200 p-3 bg-white">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{st.name}</span>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={st.isAvailable}
                            onChange={(e) =>
                              toggleItemServiceTypeAvailability(idx, st.serviceTypeId, e.target.checked)
                            }
                            className="h-4 w-4"
                          />
                          <span className="ml-1 text-xs">{t("common.available") || "Available"}</span>
                        </label>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{st.description}</p>
                      <p className="text-xs text-blue-700">
                        {t("serviceProvider.transportation.services.model") || "Model"}:{" "}
                        {String(st.pricingModel || "").replace("_", " ")}
                      </p>
                      {st.isPopular && (
                        <div className="text-xs text-amber-700 font-medium flex items-center mt-1">
                          <Icon type="info" className="mr-1" />
                          {t("serviceProvider.transportation.services.popularChoice")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-2xl bg-white">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gradient-to-br from-[#3B5787]/10 to-[#67BAE0]/10 flex items-center justify-center">
              <span className="text-2xl">🚗</span>
            </div>
            <div className="font-semibold text-gray-800">
              {t("serviceProvider.transportation.services.noVehicleTypesAdded")}
            </div>
            <div className="text-sm text-gray-500">
              {t("serviceProvider.transportation.services.useDropdownToAdd")}
            </div>
          </div>
        )}
      </div>

      {/* Create CTA */}
      <div className="flex justify-center sm:justify-end">
        <button
          onClick={createService}
          disabled={loading || transportationItems.length === 0}
          className={
            BTN.primary +
            " px-6 py-3 " +
            (loading || transportationItems.length === 0 ? " opacity-70 cursor-not-allowed" : "")
          }
        >
          <Icon type="save" />
          {loading
            ? t("serviceProvider.transportation.services.messages.creatingService")
            : t("serviceProvider.transportation.services.createTransportationService")}
        </button>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      className={INPUT}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

export default TransportationServiceCreator;
