/**
 * useServiceProviderCategories hook
 * Custom hook to fetch and manage service provider's allowed categories
 */

import { useState, useEffect } from 'react';
import apiClient from '../services/api.service';
import useAuth from './useAuth';

const useServiceProviderCategories = () => {
  const { role, currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      // Only fetch for service providers
      if (role !== 'service' || !currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch available categories from the API
        const response = await apiClient.get('/service/categories');

        if (response.data && response.data.data) {
          // Extract category keys from available categories
          const availableCategories = Object.keys(response.data.data.availableCategories || {});
          setCategories(availableCategories);
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error('Error fetching service provider categories:', err);
        setError(err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [role, currentUser]);

  return {
    categories,
    loading,
    error,
    hasCategory: (categoryName) => categories.includes(categoryName),
    hasAnyCategory: () => categories.length > 0
  };
};

export default useServiceProviderCategories;
