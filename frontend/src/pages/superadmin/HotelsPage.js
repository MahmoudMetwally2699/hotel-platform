/**
 * SuperAdmin Hotels Page
 * Displays a list of all hotels and provides hotel creation and management functions
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllHotels,
  createHotel,
  updateHotel,
  deleteHotel,
  selectHotels,
  selectHotelsLoading
} from '../../redux/slices/hotelSlice';
// import { toast } from 'react-toastify'; // Temporarily commented out to debug

const SuperAdminHotelsPage = () => {
  const dispatch = useDispatch();
  const hotels = useSelector(selectHotels);
  const isLoading = useSelector(selectHotelsLoading);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);  // Form data for creating/editing hotels
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    facilities: [],
    isActive: true,
    isPublished: false,
    // Additional hotel fields
    category: 'mid-range',
    starRating: 3,
    totalRooms: 50,
    totalFloors: 5,
    taxId: '',
    businessLicense: {
      number: '',
      issuedBy: '',
      issuedDate: '',
      expiryDate: ''
    },
    // Payment Settings
    paymentSettings: {
      enableOnlinePayment: false,
      currency: 'USD',
      acceptedMethods: ['cash']
    },
    // Hotel Admin credentials
    adminData: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    },
    // Hotel Images
    images: {
      logo: '',
      coverImage: '',
      gallery: []
    }
  });

  // File upload states
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  useEffect(() => {
    dispatch(fetchAllHotels());
  }, [dispatch]);const handleCreateHotel = async (e) => {
    e.preventDefault();

    // Validate admin credentials
    if (!formData.adminData.firstName || !formData.adminData.lastName ||
        !formData.adminData.email || !formData.adminData.password) {
      alert('Please fill in all hotel admin credentials'); // Temporary replacement
      return;
    }

    if (formData.adminData.password !== formData.adminData.confirmPassword) {
      alert('Admin passwords do not match'); // Temporary replacement
      return;
    }

    if (formData.adminData.password.length < 6) {
      alert('Admin password must be at least 6 characters long'); // Temporary replacement
      return;
    }

    try {
      // Upload logo if provided
      let logoUrl = '';
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }

      // Prepare final form data with logo
      const finalFormData = {
        ...formData,
        images: {
          ...formData.images,
          logo: logoUrl
        }
      };

      await dispatch(createHotel(finalFormData)).unwrap();
      alert('Hotel and admin account created successfully!'); // Temporary replacement
      setShowCreateModal(false);
      resetForm();
      dispatch(fetchAllHotels());
    } catch (error) {
      alert(`Error creating hotel: ${error.message || JSON.stringify(error)}`); // Temporary replacement
    }
  };

  const handleUpdateHotel = async (e) => {
    e.preventDefault();

    // Only validate passwords if at least one password field has actual content
    const passwordValue = formData.adminData.password ? formData.adminData.password.trim() : '';
    const confirmPasswordValue = formData.adminData.confirmPassword ? formData.adminData.confirmPassword.trim() : '';
    const hasPasswordData = passwordValue !== '' || confirmPasswordValue !== '';

    if (hasPasswordData) {
      // If user is trying to change password, both fields must be filled and match
      if (passwordValue === '') {
        alert('Please enter the new password');
        return;
      }

      if (confirmPasswordValue === '') {
        alert('Please confirm the new password');
        return;
      }

      if (passwordValue !== confirmPasswordValue) {
        alert('Admin passwords do not match');
        return;
      }

      if (passwordValue.length < 6) {
        alert('Admin password must be at least 6 characters long');
        return;
      }
    }

    try {
      // Upload logo if a new one was selected
      let logoUrl = selectedHotel.images?.logo; // Keep existing logo by default
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }

      // Prepare updated hotel data
      const updatedHotelData = {
        ...formData,
        images: {
          ...formData.images,
          logo: logoUrl
        }
      };

      // If admin credentials are provided, include them
      const hasAdminDataToUpdate = formData.adminData.firstName?.trim() ||
                                   formData.adminData.lastName?.trim() ||
                                   formData.adminData.email?.trim() ||
                                   formData.adminData.phone?.trim() ||
                                   (formData.adminData.password?.trim() && formData.adminData.password.length > 0);

      if (hasAdminDataToUpdate) {
        // Only include password if it's actually provided
        const adminDataToUpdate = {
          firstName: formData.adminData.firstName,
          lastName: formData.adminData.lastName,
          email: formData.adminData.email,
          phone: formData.adminData.phone
        };

        // Only include password if user provided one
        if (formData.adminData.password && formData.adminData.password.trim() !== '') {
          adminDataToUpdate.password = formData.adminData.password;
        }

        updatedHotelData.adminData = adminDataToUpdate;
      }      await dispatch(updateHotel({ id: selectedHotel._id, ...updatedHotelData })).unwrap();
      alert('Hotel updated successfully');
      setShowEditModal(false);
      resetForm();
      dispatch(fetchAllHotels());
    } catch (error) {
      alert(`Error updating hotel: ${error.message || error}`);
    }
  };

  const handleDeleteHotel = (hotelId) => {
    if (window.confirm('Are you sure you want to delete this hotel? This action cannot be undone.')) {      dispatch(deleteHotel(hotelId))
        .unwrap()
        .then(() => {
          // toast.success('Hotel deleted successfully');
          alert('Hotel deleted successfully'); // Temporary replacement
          dispatch(fetchAllHotels());
        })
        .catch((error) => {
          // toast.error(`Error deleting hotel: ${error.message || error}`);
          alert(`Error deleting hotel: ${error.message || error}`); // Temporary replacement
        });
    }
  };

  // Handle logo file selection
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
    }
  };

  // Upload logo to Cloudinary
  const uploadLogo = async (file) => {
    try {
      // Check if Cloudinary is properly configured
      const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || cloudName === 'hotel-platform-demo' || cloudName === 'your_cloud_name_here') {
        alert('Cloudinary not configured, using local preview');

        // Create a local blob URL for testing
        const localUrl = URL.createObjectURL(file);
        return localUrl;
      }

      // Prepare form data for Cloudinary upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      // Try with upload preset first, then fallback to signed upload
      if (uploadPreset) {
        uploadFormData.append('upload_preset', uploadPreset);
      } else {
        // If no upload preset, we'll need to use signed uploads
      }

      uploadFormData.append('folder', 'hotel-platform/hotel-logos');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: uploadFormData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        // If upload preset failed, provide helpful error and use local preview
        if (errorData.error?.message?.includes('Upload preset')) {
          alert(`Upload preset "${uploadPreset}" not found. Please create an unsigned upload preset named "${uploadPreset}" in your Cloudinary dashboard.\n\nSteps:\n1. Go to Settings > Upload\n2. Add upload preset\n3. Set it to "Unsigned"\n4. Enable "Use filename or externally defined Public ID"\n\nFor now, using local preview.`);

          // Create a local blob URL for testing
          const localUrl = URL.createObjectURL(file);
          return localUrl;
        }

        throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      alert('Hotel logo uploaded successfully to Cloudinary!');
      return data.secure_url;
    } catch (error) {
      // As fallback, always provide local preview
      if (file) {
        alert('Upload failed, using local preview');
        const localUrl = URL.createObjectURL(file);
        return localUrl;
      }

      alert(`Failed to upload hotel logo: ${error.message}`);
      throw error;
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: ''
      },
      facilities: [],
      isActive: true,
      isPublished: false,
      // Additional hotel fields
      category: 'mid-range',
      starRating: 3,
      totalRooms: 50,
      totalFloors: 5,
      taxId: '',
      businessLicense: {
        number: '',
        issuedBy: '',
        issuedDate: '',
        expiryDate: ''
      },
      // Payment Settings
      paymentSettings: {
        enableOnlinePayment: false,
        currency: 'USD',
        taxRate: 0,
        acceptedMethods: ['cash']
      },
      adminData: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      },
      images: {
        logo: '',
        coverImage: '',
        gallery: []
      }
    });
    setSelectedHotel(null);
    setLogoFile(null);
    setLogoPreview(null);
  };

  const openEditModal = (hotel) => {
    setSelectedHotel(hotel);

    // Clear any previous form data first
    setFormData({
      name: hotel.name || '',
      description: hotel.description || '',
      contactEmail: hotel.email || '', // Fixed: use hotel.email instead of hotel.contactEmail
      contactPhone: hotel.phone || '', // Fixed: use hotel.phone instead of hotel.contactPhone
      address: {
        street: hotel.address?.street || '',
        city: hotel.address?.city || '',
        state: hotel.address?.state || '',
        country: hotel.address?.country || '',
        zipCode: hotel.address?.zipCode || ''
      },
      facilities: hotel.facilities || [],
      isActive: hotel.isActive,
      isPublished: hotel.isPublished,
      // Payment Settings
      paymentSettings: {
        enableOnlinePayment: hotel.paymentSettings?.enableOnlinePayment || false,
        currency: hotel.paymentSettings?.currency || 'USD',
        taxRate: hotel.paymentSettings?.taxRate || 0,
        acceptedMethods: hotel.paymentSettings?.acceptedMethods || ['cash']
      },
      // Hotel Admin credentials for editing - always start with empty passwords
      adminData: {
        firstName: hotel.adminId?.firstName || '',
        lastName: hotel.adminId?.lastName || '',
        email: hotel.adminId?.email || '',
        phone: hotel.adminId?.phone || '',
        password: '', // Always empty for security and to avoid validation issues
        confirmPassword: '' // Always empty for security and to avoid validation issues
      }
    });

    // Set the existing logo preview if available
    setLogoPreview(hotel.images?.logo || null);
    setLogoFile(null); // Clear any previously selected file

    setShowEditModal(true);

    // Force clear password fields after modal opens (helps with browser autofill)
    setTimeout(() => {
      const passwordField = document.querySelector('input[name="adminData.password"]');
      const confirmField = document.querySelector('input[name="adminData.confirmPassword"]');
      if (passwordField) passwordField.value = '';
      if (confirmField) confirmField.value = '';
    }, 100);
  };  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else if (name.startsWith('adminData.')) {
      const adminField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        adminData: {
          ...prev.adminData,
          [adminField]: value
        }
      }));
    } else if (name.startsWith('businessLicense.')) {
      const licenseField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        businessLicense: {
          ...prev.businessLicense,
          [licenseField]: value
        }
      }));
    } else if (name.startsWith('paymentSettings.')) {
      const paymentField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        paymentSettings: {
          ...prev.paymentSettings,
          [paymentField]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
      }));
    }
  };

  const filteredHotels = hotels?.filter(hotel => {
    const matchesSearch = hotel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hotel.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hotel.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'active' && hotel.isActive && hotel.isPublished) ||
                         (filterStatus === 'pending' && !hotel.isPublished) ||
                         (filterStatus === 'inactive' && !hotel.isActive);
    return matchesSearch && matchesFilter;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Hotels Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage hotels on the platform. Assign administrators and monitor performance.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Hotel
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="w-full md:w-64">
          <label htmlFor="search" className="sr-only">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              id="search"
              name="search"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search hotels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full md:w-48">
          <select
            id="filter"
            name="filter"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Hotels</option>
            <option value="active">Active Hotels</option>
            <option value="pending">Pending Approval</option>
            <option value="inactive">Inactive Hotels</option>
          </select>
        </div>
      </div>

      {/* Hotels Table */}
      <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                Hotel
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Location
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Contact
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Admin
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredHotels.map((hotel) => (
              <tr key={hotel._id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{hotel.name}</div>
                      <div className="text-sm text-gray-500">{hotel.description?.substring(0, 50)}...</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <div className="text-sm text-gray-900">{hotel.address?.city}, {hotel.address?.country}</div>
                  <div className="text-sm text-gray-500">{hotel.address?.street}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <div className="text-sm text-gray-900">{hotel.email}</div>
                  <div className="text-sm text-gray-500">{hotel.phone}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    hotel.isActive && hotel.isPublished
                      ? 'bg-green-100 text-green-800'
                      : !hotel.isPublished
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {hotel.isActive && hotel.isPublished ? 'Active' : !hotel.isPublished ? 'Pending' : 'Inactive'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {hotel.adminId ? (
                    <span className="text-green-600">Assigned</span>
                  ) : (
                    <span className="text-red-600">Not Assigned</span>
                  )}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    onClick={() => openEditModal(hotel)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteHotel(hotel._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Hotel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Hotel</h3>
              <form onSubmit={handleCreateHotel} className="space-y-4">
                {/* Hotel Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Logo</label>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Upload a logo for the hotel (PNG, JPG, or GIF)</p>
                    </div>
                    {logoPreview && (
                      <div className="flex-shrink-0">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="h-16 w-16 object-cover rounded-lg border border-gray-300"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hotel Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                      type="text"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Street Address</label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State/Province</label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ZIP/Postal Code</label>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Hotel Details Section */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Hotel Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="budget">Budget</option>
                        <option value="mid-range">Mid-Range</option>
                        <option value="luxury">Luxury</option>
                        <option value="boutique">Boutique</option>
                        <option value="resort">Resort</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Star Rating</label>
                      <select
                        name="starRating"
                        value={formData.starRating}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={1}>1 Star</option>
                        <option value={2}>2 Stars</option>
                        <option value={3}>3 Stars</option>
                        <option value={4}>4 Stars</option>
                        <option value={5}>5 Stars</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tax ID</label>
                      <input
                        type="text"
                        name="taxId"
                        value={formData.taxId}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Rooms</label>
                      <input
                        type="number"
                        name="totalRooms"
                        value={formData.totalRooms}
                        onChange={handleInputChange}
                        min="1"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Floors</label>
                      <input
                        type="number"
                        name="totalFloors"
                        value={formData.totalFloors}
                        onChange={handleInputChange}
                        min="1"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Business License Section */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Business License</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">License Number</label>
                      <input
                        type="text"
                        name="businessLicense.number"
                        value={formData.businessLicense.number}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Issued By</label>
                      <input
                        type="text"
                        name="businessLicense.issuedBy"
                        value={formData.businessLicense.issuedBy}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                      <input
                        type="date"
                        name="businessLicense.issuedDate"
                        value={formData.businessLicense.issuedDate}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                      <input
                        type="date"
                        name="businessLicense.expiryDate"
                        value={formData.businessLicense.expiryDate}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Settings Section */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Payment Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="paymentSettings.enableOnlinePayment"
                          checked={formData.paymentSettings.enableOnlinePayment}
                          onChange={handleInputChange}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">Enable Online Payment (Kashier.io)</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Allow guests to pay online using Kashier.io payment gateway</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Currency</label>
                      <select
                        name="paymentSettings.currency"
                        value={formData.paymentSettings.currency}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="AUD">AUD - Australian Dollar</option>
                        <option value="EGP">EGP - Egyptian Pound</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Hotel Admin Credentials Section */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Hotel Admin Credentials</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Admin First Name</label>
                      <input
                        type="text"
                        name="adminData.firstName"
                        value={formData.adminData.firstName}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Admin Last Name</label>
                      <input
                        type="text"
                        name="adminData.lastName"
                        value={formData.adminData.lastName}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Admin Email</label>
                      <input
                        type="email"
                        name="adminData.email"
                        value={formData.adminData.email}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Admin Phone</label>
                      <input
                        type="tel"
                        name="adminData.phone"
                        value={formData.adminData.phone}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Admin Password</label>
                      <input
                        type="password"
                        name="adminData.password"
                        value={formData.adminData.password}
                        onChange={handleInputChange}
                        required
                        minLength={6}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                      <input
                        type="password"
                        name="adminData.confirmPassword"
                        value={formData.adminData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        minLength={6}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-600">Active</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isPublished"
                      checked={formData.isPublished}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-600">Published</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create Hotel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Hotel Modal */}
      {showEditModal && selectedHotel && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Hotel: {selectedHotel.name}</h3>
              <form onSubmit={handleUpdateHotel} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hotel Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                      type="text"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Street Address</label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State/Province</label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ZIP/Postal Code</label>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Hotel Logo Upload Section */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Logo</label>
                  <div className="space-y-3">
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Upload a new logo for the hotel (PNG, JPG, or GIF). Leave empty to keep current logo.</p>
                    </div>
                    {logoPreview && (
                      <div className="mt-3">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="h-20 w-auto object-contain border border-gray-300 rounded-md p-2 bg-gray-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {logoFile ? 'New logo preview' : 'Current hotel logo'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Settings Section */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Payment Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="paymentSettings.enableOnlinePayment"
                          checked={formData.paymentSettings?.enableOnlinePayment || false}
                          onChange={handleInputChange}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700 font-medium">Enable Online Payment (Kashier.io)</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-6">Allow guests to pay online using Kashier.io payment gateway</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Currency</label>
                      <select
                        name="paymentSettings.currency"
                        value={formData.paymentSettings?.currency || 'USD'}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="AUD">AUD - Australian Dollar</option>
                        <option value="EGP">EGP - Egyptian Pound</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Hotel Admin Credentials Section */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Hotel Admin Credentials</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Update hotel administrator information. All fields are optional - only modify what you want to change.
                    <span className="font-medium"> Leave password fields empty to keep current password.</span>
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Admin First Name</label>
                      <input
                        type="text"
                        name="adminData.firstName"
                        value={formData.adminData?.firstName || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Admin Last Name</label>
                      <input
                        type="text"
                        name="adminData.lastName"
                        value={formData.adminData?.lastName || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Admin Email</label>
                      <input
                        type="email"
                        name="adminData.email"
                        value={formData.adminData?.email || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Admin Phone</label>
                      <input
                        type="tel"
                        name="adminData.phone"
                        value={formData.adminData?.phone || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">New Password (Optional)</label>
                      <input
                        type="password"
                        name="adminData.password"
                        value={formData.adminData?.password || ''}
                        onChange={handleInputChange}
                        placeholder="Enter new password or leave empty"
                        autoComplete="new-password"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty to keep current password</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                      <input
                        type="password"
                        name="adminData.confirmPassword"
                        value={formData.adminData?.confirmPassword || ''}
                        onChange={handleInputChange}
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Only required if changing password</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-600">Active</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isPublished"
                      checked={formData.isPublished}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-600">Published</span>
                  </label>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this hotel? This action cannot be undone and will also deactivate the hotel admin account.')) {
                        dispatch(deleteHotel(selectedHotel._id))
                          .unwrap()
                          .then(() => {
                            alert('Hotel deleted successfully');
                            setShowEditModal(false);
                            resetForm();
                            dispatch(fetchAllHotels());
                          })
                          .catch((error) => {
                            alert(`Error deleting hotel: ${error.message || error}`);
                          });
                      }
                    }}
                    className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete Hotel
                  </button>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Update Hotel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminHotelsPage;
