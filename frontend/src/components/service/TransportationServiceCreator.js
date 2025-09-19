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
import VehicleIcon from "../common/VehicleIcon";

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
    "inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white " +
    "bg-gradient-to-r from-[#3B5787] to-[#67BAE0] hover:from-[#2A4A6B] hover:to-[#5BA8CC] " +
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B5787] transition-all duration-300 " +
    "shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
  secondary:
    "inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-[#3B5787] " +
    "bg-white border-2 border-[#3B5787] hover:bg-[#3B5787] hover:text-white focus:outline-none " +
    "focus:ring-2 focus:ring-offset-2 focus:ring-[#3B5787] transition-all duration-300 shadow-md hover:shadow-lg",
  ghost:
    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 " +
    "bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 focus:outline-none " +
    "focus:ring-2 focus:ring-offset-2 focus:ring-[#67BAE0] transition-all duration-200 shadow-sm",
  warn:
    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white " +
    "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 focus:outline-none " +
    "focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-300 shadow-md hover:shadow-lg",
  success:
    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white " +
    "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 focus:outline-none " +
    "focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 shadow-md hover:shadow-lg",
  danger:
    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white " +
    "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none " +
    "focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 shadow-md hover:shadow-lg",
};

const INPUT =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition-all duration-200 " +
  "focus:outline-none focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] focus:bg-white " +
  "hover:border-gray-300 placeholder-gray-400";

const CARD =
  "p-6 sm:p-8 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 " +
  "backdrop-blur-sm bg-white/90";

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
      console.log("Fetching existing transportation services...");
      const response = await apiClient.get("/service/services?category=transportation");
      console.log("Fetch response:", response.data);

      let services = [];
      if (response.data?.data?.services) services = response.data.data.services;
      else if (response.data?.services) services = response.data.services;
      else if (Array.isArray(response.data?.data)) services = response.data.data;
      else if (Array.isArray(response.data)) services = response.data;

      console.log("Parsed services:", services);
      console.log("Services count:", services.length);

      setExistingServices(services || []);
    } catch (error) {
      console.error("Fetch services error:", error);
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

  // Edit mode vehicle management functions
  const addVehicleToEditForm = (vehicleTypeId) => {
    if (!vehicleTypeId) return;
    const vehicleTemplate = availableVehicles.find((v) => v.id === vehicleTypeId);
    if (!vehicleTemplate) return;
    if (editFormData.transportationItems.some((item) => item.vehicleType === vehicleTypeId)) {
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
    setEditFormData((prev) => ({
      ...prev,
      transportationItems: [...prev.transportationItems, newVehicleItem],
    }));
    toast.success(
      `${vehicleTemplate.name} ${t(
        "serviceProvider.transportation.services.messages.vehicleAddedSuccessfully"
      )}`
    );
  };

  const removeVehicleFromEditForm = (vehicleIndex) => {
    setEditFormData((prev) => ({
      ...prev,
      transportationItems: prev.transportationItems.filter((_, idx) => idx !== vehicleIndex),
    }));
    toast.success("Vehicle removed successfully");
  };

  const toggleEditFormServiceTypeAvailability = (vehicleIdx, serviceTypeId, isAvailable) => {
    setEditFormData((prev) => ({
      ...prev,
      transportationItems: prev.transportationItems.map((vehicle, vIdx) => {
        if (vIdx !== vehicleIdx) return vehicle;
        return {
          ...vehicle,
          serviceTypes: vehicle.serviceTypes.map((st) =>
            st.serviceTypeId === serviceTypeId ? { ...st, isAvailable } : st
          ),
        };
      }),
    }));
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
        pricing: {
          basePrice: 1, // Minimum required value for validation
          pricingType: "quote-based",
          currency: "USD",
          isQuoteBased: true // Flag to indicate this is quote-based pricing
        },
        isActive: true,
      };

      // Debug logging
      console.log("Creating new transportation service:", serviceData);
      console.log("Current existing services count:", existingServices.length);

      // Use the general services endpoint instead of transportation-specific endpoint
      // to allow multiple transportation services per provider
      const response = await apiClient.post("/service/services", serviceData);
      console.log("Service creation response:", response.data);

      toast.success(
        t("serviceProvider.transportation.services.messages.quoteServiceCreatedSuccessfully")
      );
      setServiceDetails({ name: "", description: "", shortDescription: "", isActive: true });
      setTransportationItems([]);
      setActiveTab("manage");

      // Force refresh the services list after a short delay to ensure DB has updated
      setTimeout(async () => {
        await fetchExistingServices();
      }, 1000);
    } catch (error) {
      console.error("Service creation error:", error);
      console.error("Error response:", error?.response?.data);
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
    // Return VehicleIcon component with larger size that fills container better
    return <VehicleIcon vehicleType={vehicleType} className="w-10 h-10" />;
  };

  // ---------------- Render ----------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Modern Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3B5787] via-[#4A6B95] to-[#67BAE0] p-8 sm:p-12 text-white shadow-2xl mb-8">
          {/* Decorative Elements */}
          <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-white/10 blur-xl"></div>
          <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-white/15"></div>
          <div className="absolute top-8 right-1/4 h-6 w-6 rounded-full bg-white/20"></div>
          <div className="absolute bottom-12 right-12 h-4 w-4 rounded-full bg-white/25"></div>

          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm mr-4 flex items-center justify-center">
                <VehicleIcon vehicleType="car" size="large" className="w-8 h-8" inverse={true} />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                  Transportation Services
                </h1>
                <div className="h-1 w-20 bg-gradient-to-r from-white/60 to-transparent rounded-full mt-2"></div>
              </div>
            </div>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl leading-relaxed">
              Create vehicle offerings, enable service types, and keep your catalog sharp.
            </p>

            {/* Stats Quick View */}
            <div className="flex flex-wrap gap-6 mt-8">
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                <VehicleIcon vehicleType="car" size="small" className="w-5 h-5 mr-2" inverse={true} />
                <span className="text-sm font-medium">
                  {existingServices.length} Services
                </span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                <Icon type="stats" className="text-xl mr-2" />
                <span className="text-sm font-medium">
                  Active: {existingServices.filter(s => s.isActive).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div className="relative mb-8">
          <div className="flex bg-gray-100 rounded-2xl p-1 max-w-md mx-auto">
            <button
              onClick={() => setActiveTab("manage")}
              className={
                'flex-1 py-3 px-6 text-sm font-semibold rounded-xl transition-all duration-300 ' +
                (activeTab === "manage"
                  ? 'bg-white text-[#3B5787] shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-[#3B5787] hover:bg-white/50')
              }
            >
              <Icon type="list" className="mr-2" />
              Manage Services
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className={
                'flex-1 py-3 px-6 text-sm font-semibold rounded-xl transition-all duration-300 ' +
                (activeTab === "add"
                  ? 'bg-white text-[#3B5787] shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-[#3B5787] hover:bg-white/50')
              }
            >
              <Icon type="plus" className="mr-2" />
              Add New Service
            </button>
          </div>
        </div>

        {/* Modern Sticky Toolbar (Manage only) */}
        {activeTab === "manage" && (
          <div className="sticky top-0 z-20 mb-8">
            <div className={CARD + " border-2 border-[#67BAE0]/20 bg-gradient-to-r from-white via-blue-50/30 to-white"}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#3B5787]">
                    <Icon type="search" />
                  </span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search services..."
                    className={INPUT + " pl-12 bg-white border-[#67BAE0]/30 focus:border-[#3B5787]"}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#3B5787] shrink-0 flex items-center">
                    <Icon type="filter" className="mr-2" />
                    Status
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={INPUT + " bg-white border-[#67BAE0]/30 focus:border-[#3B5787]"}
                  >
                    <option value="all">All Services</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#3B5787] shrink-0 flex items-center">
                    <Icon type="sort" className="mr-2" />
                    Sort
                  </span>
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value)}
                    className={INPUT + " bg-white border-[#67BAE0]/30 focus:border-[#3B5787]"}
                  >
                    <option value="updated">Recently Updated</option>
                    <option value="name">Name A-Z</option>
                    <option value="bookings">Most Bookings</option>
                    <option value="revenue">Highest Revenue</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                    className={BTN.ghost + " flex-1 justify-center"}
                    title="Toggle sort direction"
                  >
                    <Icon type="sort" />
                    {sortDir === "asc" ? "↑ Ascending" : "↓ Descending"}
                  </button>
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
          availableVehicles={availableVehicles}
          categoryTemplate={categoryTemplate}
          addVehicleToEditForm={addVehicleToEditForm}
          removeVehicleFromEditForm={removeVehicleFromEditForm}
          toggleEditFormServiceTypeAvailability={toggleEditFormServiceTypeAvailability}
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
  availableVehicles,
  categoryTemplate,
  addVehicleToEditForm,
  removeVehicleFromEditForm,
  toggleEditFormServiceTypeAvailability,
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-white relative overflow-hidden mx-3 sm:mx-4 lg:mx-6">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full opacity-50"></div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full opacity-50"></div>
          <div className="relative flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">Transportation Services</h1>
            <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">Loading available transportation services...</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-center items-center h-96">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#67BAE0] border-t-transparent"></div>
              <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-[#3B5787] border-t-transparent animate-ping opacity-20"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pageData.length === 0) {
    return (
      <div className={CARD + ' text-center py-20'}>
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#3B5787]/20 to-[#67BAE0]/20 rounded-full blur-2xl"></div>
          <div className="relative flex items-center justify-center">
            <VehicleIcon vehicleType="car" size="xl" className="w-20 h-20 opacity-30" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          No Transportation Services Found
        </h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
          Ready to get started? Create your first transportation service and start managing your fleet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Your Transportation Services
          </h3>
          <p className="text-gray-600">
            {pageData.length} of {totalPages > 1 ? `${totalPages} pages` : 'total services'}
          </p>
        </div>
      </div>

      {/* Modern Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {pageData.map((service) => (
          <div
            key={service._id}
            className={
              editingService === service._id
                ? 'lg:col-span-2 xl:col-span-3 ' + CARD + ' group transition-all duration-300 relative overflow-hidden'
                : CARD + ' group hover:scale-105 transition-all duration-300 relative overflow-hidden'
            }
          >
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#67BAE0]/10 to-transparent rounded-bl-full"></div>

            {editingService === service._id ? (
              // ------------ Enhanced Edit Mode with Vehicle Management ------------
              <div className="relative z-10 space-y-8 p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Edit Service</h3>
                  <p className="text-gray-600 mt-2">Update your transportation service details</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Basic Information */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Service Name
                      </label>
                      <input
                        className={INPUT + " text-lg"}
                        value={editFormData.name}
                        onChange={(e) =>
                          setEditFormData((p) => ({ ...p, name: e.target.value }))
                        }
                        placeholder="Enter service name..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Description
                      </label>
                      <textarea
                        rows={6}
                        className={INPUT}
                        value={editFormData.description}
                        onChange={(e) =>
                          setEditFormData((p) => ({ ...p, description: e.target.value }))
                        }
                        placeholder="Describe your transportation service..."
                      />
                    </div>
                  </div>

                  {/* Right Column - Vehicle Management */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-800">Vehicle Types</h4>
                        <select
                          onChange={(e) => addVehicleToEditForm(e.target.value)}
                          className="text-sm border border-gray-300 rounded-lg px-4 py-2 focus:border-[#3B5787] focus:ring-[#3B5787]/20 min-w-[200px]"
                          value=""
                        >
                          <option value="">Add Vehicle Type</option>
                          {availableVehicles
                            .filter((v) => !editFormData.transportationItems?.some((item) => item.vehicleType === v.id))
                            .map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name} ({typeof v.capacity === "object" ? v.capacity.passengers : v.capacity} passengers)
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Display Current Vehicles */}
                      {editFormData.transportationItems && editFormData.transportationItems.length > 0 ? (
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                          {editFormData.transportationItems.map((vehicle, idx) => (
                            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                  <div className="flex items-center justify-center">
                                    <VehicleIcon vehicleType={vehicle.vehicleType} className="w-14 h-14" />
                                  </div>
                                  <div className="flex-1">
                                    <h6 className="font-semibold text-gray-800 text-base mb-1">{vehicle.name}</h6>
                                    <p className="text-gray-600 text-sm mb-3">{vehicle.description}</p>
                                    <div className="flex items-center gap-3 text-sm mb-4">
                                      <span className="bg-blue-100 text-[#3B5787] px-3 py-1 rounded-full font-medium">
                                        👥 {vehicle?.capacity?.passengers} passengers
                                      </span>
                                      {vehicle?.capacity?.luggage != null && (
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                                          🧳 {vehicle.capacity.luggage} luggage
                                        </span>
                                      )}
                                    </div>

                                    {/* Service Types for this vehicle */}
                                    <div>
                                      <div className="grid grid-cols-1 gap-3">
                                        {vehicle.serviceTypes.map((st, sIdx) => (
                                          <div key={sIdx} className="bg-white border border-gray-200 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                              <span className="text-sm font-medium text-gray-700">{st.name}</span>
                                              <label className="flex items-center gap-2">
                                                <input
                                                  type="checkbox"
                                                  checked={st.isAvailable}
                                                  onChange={(e) =>
                                                    toggleEditFormServiceTypeAvailability(idx, st.serviceTypeId, e.target.checked)
                                                  }
                                                  className="w-4 h-4 text-[#3B5787] border-gray-300 rounded focus:ring-[#3B5787]"
                                                />
                                                <span className="text-sm text-gray-600">Active</span>
                                              </label>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeVehicleFromEditForm(idx)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove vehicle"
                                >
                                  <Icon type="trash" className="text-lg" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-xl">
                          <div className="text-gray-500 text-sm">
                            No vehicle types added yet. Use the dropdown above to add vehicles.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200 justify-center">
                  <button
                    onClick={() => saveEditedService(service._id)}
                    className={BTN.primary + ' px-8 py-3 text-lg'}
                  >
                    <Icon type="save" />
                    Save Changes
                  </button>
                  <button
                    onClick={cancelEditing}
                    className={BTN.ghost + ' px-8 py-3 text-lg'}
                  >
                    <Icon type="times" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // ------------ Enhanced View Mode ------------
              <div className="relative z-10 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <VehicleIcon vehicleType={service.transportationItems?.[0]?.vehicleType} className="w-12 h-12" />
                      <h4 className="text-xl font-bold text-gray-900">{service.name}</h4>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{service.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={
                      service.isActive
                        ? 'px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200'
                    }>
                      {service.isActive ? '● Active' : '● Inactive'}
                    </span>
                  </div>
                </div>

                {/* Enhanced Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-[#3B5787]/10 to-[#67BAE0]/10 rounded-2xl p-4 text-center border border-[#67BAE0]/20">
                    <div className="text-2xl font-bold text-[#3B5787] mb-1">
                      {service.transportationItems?.length || 0}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      Vehicles
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 text-center border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {service?.performance?.totalBookings || service.stats?.bookings || service.totalBookings || 0}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      Bookings
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 text-center border border-emerald-200">
                    <div className="text-2xl font-bold text-emerald-600 mb-1">
                      ${service?.performance?.totalRevenue || service.stats?.revenue || service.totalRevenue || 0}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      Revenue
                    </div>
                  </div>
                </div>

                {/* Vehicle chips */}
                {service.transportationItems?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {service.transportationItems.map((v, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-800 border border-blue-100"
                      >
                        <VehicleIcon vehicleType={v.vehicleType} className="w-5 h-5" />
                        {v.name}
                        {v?.capacity?.passengers != null && (
                          <span className="text-blue-600">({v.capacity.passengers}p)</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {/* Modern Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => startEditingService(service)}
                    className={BTN.secondary + ' flex-1 sm:flex-none'}
                  >
                    <Icon type="edit" />
                    Edit
                  </button>
                  <button
                    onClick={() => toggleServiceAvailability(service._id, service.isActive)}
                    className={(service.isActive ? BTN.warn : BTN.success) + ' flex-1 sm:flex-none'}
                  >
                    <Icon type="toggle" />
                    {service.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteService(service._id)}
                    className={BTN.danger + ' flex-1 sm:flex-none'}
                  >
                    <Icon type="trash" />
                    Delete
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
    </div>
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
    <div className="space-y-8">
      {/* Modern Service Information Card */}
      <div className={CARD + " border-2 border-[#67BAE0]/20 bg-gradient-to-br from-white via-blue-50/30 to-white"}>
        <div className="border-b border-[#67BAE0]/20 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-2xl mr-4">
              <Icon type="plus" className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#3B5787]">
                Create New Transportation Service
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Set up your transportation service details and vehicle options
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-[#3B5787] mb-2">
                Service Name *
              </label>
              <input
                value={serviceDetails.name}
                onChange={(e) => setServiceDetails((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Airport Transfer Service"
                className={INPUT + " bg-white border-[#67BAE0]/30 focus:border-[#3B5787] focus:ring-[#3B5787]/20"}
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Tip: Use unique names for each service to avoid conflicts
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-[#3B5787] mb-2">
                Short Description
              </label>
              <input
                value={serviceDetails.description}
                onChange={(e) => setServiceDetails((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief service description..."
                className={INPUT + " bg-white border-[#67BAE0]/30 focus:border-[#3B5787] focus:ring-[#3B5787]/20"}
              />
            </div>

            <div className="lg:col-span-2 space-y-1">
              <label className="block text-sm font-semibold text-[#3B5787] mb-2">
                Service Details
              </label>
              <textarea
                value={serviceDetails.details}
                onChange={(e) => setServiceDetails((p) => ({ ...p, details: e.target.value }))}
                placeholder="Provide detailed information about your transportation service..."
                rows={4}
                className={INPUT + " bg-white border-[#67BAE0]/30 focus:border-[#3B5787] focus:ring-[#3B5787]/20 resize-none"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Vehicle Types Section */}
      <div className={CARD + " border-2 border-[#67BAE0]/20 bg-gradient-to-br from-white via-blue-50/30 to-white"}>
        <div className="border-b border-[#67BAE0]/20 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <div className="mr-4 flex items-center justify-center">
                <VehicleIcon vehicleType="car" className="w-16 h-16" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#3B5787]">
                  Available Vehicle Types
                </h4>
                <p className="text-gray-600 text-sm">
                  Add and configure vehicle options for your service
                </p>
              </div>
            </div>

            <div className="sm:w-80">
              <select
                onChange={(e) => addVehicleFromDropdown(e.target.value)}
                className={INPUT + " bg-white border-[#67BAE0]/30 focus:border-[#3B5787] focus:ring-[#3B5787]/20"}
                value=""
              >
                <option value="">Add Vehicle Type</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({typeof v.capacity === "object" ? v.capacity.passengers : v.capacity} passengers)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3 text-[#3B5787] font-semibold mb-2">
              <Icon type="info" className="text-lg" />
              Quote-Based Pricing System
            </div>
            <p className="text-sm text-gray-700">
              Transportation services use quote-based pricing. Customers will request quotes for their specific trips,
              and you can provide customized pricing based on distance, duration, and service type.
            </p>
          </div>

          {transportationItems.length > 0 ? (
          <div className="space-y-6">
            {transportationItems.map((vehicle, idx) => (
              <div key={idx} className={CARD + " border-2 border-[#67BAE0]/20 bg-gradient-to-r from-white to-blue-50/30 hover:shadow-xl transition-all duration-300"}>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center">
                        <VehicleIcon vehicleType={vehicle.vehicleType} className="w-14 h-14" />
                      </div>
                      <div>
                        <h5 className="text-lg font-bold text-[#3B5787] mb-1">{vehicle.name}</h5>
                        <p className="text-gray-600 text-sm mb-2">{vehicle.description}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="bg-blue-100 text-[#3B5787] px-3 py-1 rounded-full font-medium">
                            👥 {vehicle?.capacity?.passengers} passengers
                          </span>
                          {vehicle?.capacity?.luggage != null && (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                              🧳 {vehicle.capacity.luggage} luggage
                            </span>
                          )}
                        </div>
                        {Array.isArray(vehicle.features) && vehicle.features.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {vehicle.features.map((f, i) => (
                              <span key={i} className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white text-xs px-3 py-1 rounded-full font-medium">
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeTransportationItem(idx)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                      title="Remove vehicle"
                    >
                      <Icon type="trash" className="text-xl" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicle.serviceTypes.map((st, sIdx) => (
                      <div key={sIdx} className="bg-white border border-[#67BAE0]/20 rounded-2xl p-4 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-[#3B5787]">{st.name}</span>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={st.isAvailable}
                              onChange={(e) =>
                                toggleItemServiceTypeAvailability(idx, st.serviceTypeId, e.target.checked)
                              }
                              className="w-4 h-4 text-[#3B5787] border-[#67BAE0] rounded focus:ring-[#3B5787]"
                            />
                            <span className="text-xs font-medium text-gray-600">Available</span>
                          </label>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{st.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="bg-gradient-to-r from-[#3B5787]/10 to-[#67BAE0]/10 text-[#3B5787] text-xs px-2 py-1 rounded-lg font-medium">
                            {String(st.pricingModel || "").replace("_", " ")}
                          </span>
                          {st.isPopular && (
                            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-lg font-medium flex items-center">
                              ⭐ Popular
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-[#67BAE0]/30 rounded-2xl bg-gradient-to-br from-white to-blue-50/30">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-[#3B5787]/10 to-[#67BAE0]/10 flex items-center justify-center">
              <span className="text-3xl">🚗</span>
            </div>
            <div className="font-bold text-[#3B5787] text-lg mb-2">
              No Vehicle Types Added Yet
            </div>
            <div className="text-gray-600 text-sm">
              Use the dropdown above to add vehicle types to your transportation service
            </div>
          </div>
        )}
        </div>

      {/* Modern Create Button */}
      <div className="flex justify-center sm:justify-end">
        <button
          onClick={createService}
          disabled={loading || transportationItems.length === 0}
          className={
            'px-8 py-4 rounded-2xl font-semibold text-white text-sm transition-all duration-300 flex items-center gap-3 ' +
            (loading || transportationItems.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#3B5787] to-[#67BAE0] hover:shadow-lg hover:scale-105 active:scale-95'
            )
          }
        >
          <Icon type="save" className="text-lg" />
          {loading
            ? "Creating Service..."
            : "Create Transportation Service"}
        </button>
      </div>
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
