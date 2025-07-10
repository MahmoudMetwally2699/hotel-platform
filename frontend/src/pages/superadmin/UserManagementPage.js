import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectUsers,
  fetchUsers,
  selectUsersLoading,
  deactivateUser,
  activateUser,
  resetPassword,
  deleteUser
} from '../../redux/slices/userSlice';
import { Link } from 'react-router-dom';

const UserManagementPage = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers);
  const loading = useSelector(selectUsersLoading);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('lastName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState('');
  useEffect(() => {
    dispatch(fetchUsers({})); // Pass empty object to use default parameters
  }, [dispatch]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRoleFilter = (e) => {
    setFilterRole(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const openModal = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setActionType('');
  };

  const handleAction = () => {
    if (!selectedUser) return;

    switch (actionType) {
      case 'deactivate':
        dispatch(deactivateUser(selectedUser._id));
        break;
      case 'activate':
        dispatch(activateUser(selectedUser._id));
        break;
      case 'reset-password':
        dispatch(resetPassword(selectedUser._id));
        break;
      case 'delete':
        dispatch(deleteUser(selectedUser._id));
        break;
      default:
        break;
    }

    closeModal();
  };

  // Filter and sort users
  const filteredUsers = users?.filter(user => {
    const matchesSearch =
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'firstName':
        comparison = a.firstName.localeCompare(b.firstName);
        break;
      case 'lastName':
        comparison = a.lastName.localeCompare(b.lastName);
        break;
      case 'email':
        comparison = a.email.localeCompare(b.email);
        break;
      case 'role':
        comparison = a.role.localeCompare(b.role);
        break;
      case 'registrationDate':
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
        break;
      default:
        comparison = 0;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'superadmin':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
            Super Admin
          </span>
        );
      case 'hotel':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            Hotel Admin
          </span>
        );
      case 'service':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Service Provider
          </span>
        );
      case 'guest':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            Guest
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {role}
          </span>
        );
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
        Inactive
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">User Management</h1>
        <Link
          to="/superadmin/users/add"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New User
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div>
          <select
            value={filterRole}
            onChange={handleRoleFilter}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="hotel">Hotel Admin</option>
            <option value="service">Service Provider</option>
            <option value="guest">Guest</option>
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={handleStatusFilter}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* User List */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('lastName')}
                  >
                    <div className="flex items-center">
                      Name
                      {sortBy === 'lastName' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center">
                      Email
                      {sortBy === 'email' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center">
                      Role
                      {sortBy === 'role' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('registrationDate')}
                  >
                    <div className="flex items-center">
                      Registered On
                      {sortBy === 'registrationDate' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedUsers.length > 0 ? (
                  sortedUsers.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 mr-3">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=random`}
                              alt={`${user.firstName} ${user.lastName}`}
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">
                          {user.emailVerified ? 'Verified' : 'Unverified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                        {user.role === 'hotel' && user.hotelName && (
                          <div className="text-xs text-gray-500 mt-1">
                            {user.hotelName}
                          </div>
                        )}
                        {user.role === 'service' && user.businessName && (
                          <div className="text-xs text-gray-500 mt-1">
                            {user.businessName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.isActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/superadmin/users/${user._id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View
                        </Link>
                        <Link
                          to={`/superadmin/users/${user._id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() => openModal(user, 'reset-password')}
                          className="text-purple-600 hover:text-purple-900 mr-4"
                        >
                          Reset PW
                        </button>

                        {user.isActive ? (
                          <button
                            type="button"
                            onClick={() => openModal(user, 'deactivate')}
                            className="text-yellow-600 hover:text-yellow-900 mr-4"
                            disabled={user.role === 'superadmin' && user._id === 'current-user-id'} // Prevent deactivating yourself
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openModal(user, 'activate')}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            Activate
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openModal(user, 'delete')}
                          className="text-red-600 hover:text-red-900"
                          disabled={user.role === 'superadmin' && user._id === 'current-user-id'} // Prevent deleting yourself
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                        ? 'No users match your search criteria'
                        : 'No users found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeModal}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                    actionType === 'activate' ? 'bg-green-100' :
                    actionType === 'deactivate' ? 'bg-yellow-100' :
                    actionType === 'reset-password' ? 'bg-blue-100' :
                    'bg-red-100'
                  }`}>
                    {actionType === 'activate' ? (
                      <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : actionType === 'deactivate' ? (
                      <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ) : actionType === 'reset-password' ? (
                      <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      {actionType === 'activate' ? 'Activate User' :
                       actionType === 'deactivate' ? 'Deactivate User' :
                       actionType === 'reset-password' ? 'Reset Password' :
                       'Delete User'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {actionType === 'activate'
                          ? `Are you sure you want to activate ${selectedUser.firstName} ${selectedUser.lastName}'s account?`
                          : actionType === 'deactivate'
                            ? `Are you sure you want to deactivate ${selectedUser.firstName} ${selectedUser.lastName}'s account? They will no longer be able to log in.`
                            : actionType === 'reset-password'
                              ? `Are you sure you want to reset ${selectedUser.firstName} ${selectedUser.lastName}'s password? They will receive an email with instructions to set a new password.`
                              : `Are you sure you want to delete ${selectedUser.firstName} ${selectedUser.lastName}'s account? All of their data will be permanently removed from our servers. This action cannot be undone.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${
                    actionType === 'activate'
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : actionType === 'deactivate'
                        ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                        : actionType === 'reset-password'
                          ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                          : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
                  onClick={handleAction}
                >
                  {actionType === 'activate' ? 'Activate' :
                   actionType === 'deactivate' ? 'Deactivate' :
                   actionType === 'reset-password' ? 'Reset' :
                   'Delete'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
