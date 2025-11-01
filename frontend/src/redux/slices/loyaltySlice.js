import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = (getState) => {
  const token = getState().auth?.token || localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  };
};

// ============================================
// GUEST THUNKS
// ============================================

/**
 * Get current user's loyalty membership
 */
export const fetchMyMembership = createAsyncThunk(
  'loyalty/fetchMyMembership',
  async (hotelId, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/loyalty/my-membership?hotelId=${hotelId}`,
        getAuthHeaders(getState)
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch membership');
    }
  }
);

/**
 * Get available rewards for guest
 */
export const fetchAvailableRewards = createAsyncThunk(
  'loyalty/fetchAvailableRewards',
  async (hotelId, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/loyalty/available-rewards?hotelId=${hotelId}`,
        getAuthHeaders(getState)
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch rewards');
    }
  }
);

/**
 * Redeem a reward
 */
export const redeemReward = createAsyncThunk(
  'loyalty/redeemReward',
  async ({ rewardId, hotelId }, { getState, rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/loyalty/redeem/${rewardId}`,
        { hotelId },
        getAuthHeaders(getState)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to redeem reward');
    }
  }
);

/**
 * Get points and redemption history
 */
export const fetchPointsHistory = createAsyncThunk(
  'loyalty/fetchPointsHistory',
  async ({ hotelId, type, limit }, { getState, rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ hotelId });
      if (type) params.append('type', type);
      if (limit) params.append('limit', limit);

      const response = await axios.get(
        `${API_URL}/api/loyalty/my-history?${params.toString()}`,
        getAuthHeaders(getState)
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch history');
    }
  }
);

/**
 * Get loyalty program details for a hotel
 */
export const fetchProgramDetails = createAsyncThunk(
  'loyalty/fetchProgramDetails',
  async (hotelId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/loyalty/program-details/${hotelId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch program details');
    }
  }
);

// ============================================
// HOTEL ADMIN THUNKS
// ============================================

/**
 * Create or update loyalty program
 */
export const createOrUpdateProgram = createAsyncThunk(
  'loyalty/createOrUpdateProgram',
  async (programData, { getState, rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/loyalty/hotel/program`,
        programData,
        getAuthHeaders(getState)
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save program');
    }
  }
);

/**
 * Get hotel's loyalty program
 */
export const fetchLoyaltyProgram = createAsyncThunk(
  'loyalty/fetchLoyaltyProgram',
  async (_, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/loyalty/hotel/program`,
        getAuthHeaders(getState)
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch program');
    }
  }
);

/**
 * Get all loyalty members
 */
export const fetchMembers = createAsyncThunk(
  'loyalty/fetchMembers',
  async (filters, { getState, rejectWithValue }) => {
    try {
      const params = new URLSearchParams(filters || {});
      const response = await axios.get(
        `${API_URL}/api/loyalty/hotel/members?${params.toString()}`,
        getAuthHeaders(getState)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch members');
    }
  }
);

/**
 * Get specific member details
 */
export const fetchMemberDetails = createAsyncThunk(
  'loyalty/fetchMemberDetails',
  async (memberId, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/loyalty/hotel/members/${memberId}`,
        getAuthHeaders(getState)
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch member details');
    }
  }
);

/**
 * Adjust member points
 */
export const adjustMemberPoints = createAsyncThunk(
  'loyalty/adjustMemberPoints',
  async ({ memberId, points, reason, adminNote }, { getState, rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/loyalty/hotel/members/${memberId}/adjust-points`,
        { points, reason, adminNote },
        getAuthHeaders(getState)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to adjust points');
    }
  }
);

/**
 * Change member tier
 */
export const changeMemberTier = createAsyncThunk(
  'loyalty/changeMemberTier',
  async ({ memberId, tier, reason }, { getState, rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/loyalty/hotel/members/${memberId}/change-tier`,
        { tier, reason },
        getAuthHeaders(getState)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change tier');
    }
  }
);

/**
 * Get loyalty analytics
 */
export const fetchLoyaltyAnalytics = createAsyncThunk(
  'loyalty/fetchLoyaltyAnalytics',
  async (_, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/loyalty/hotel/analytics`,
        getAuthHeaders(getState)
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

/**
 * Create new reward
 */
export const createReward = createAsyncThunk(
  'loyalty/createReward',
  async (rewardData, { getState, rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/loyalty/hotel/rewards`,
        rewardData,
        getAuthHeaders(getState)
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create reward');
    }
  }
);

/**
 * Get all rewards
 */
export const fetchRewards = createAsyncThunk(
  'loyalty/fetchRewards',
  async (filters, { getState, rejectWithValue }) => {
    try {
      const params = new URLSearchParams(filters || {});
      const response = await axios.get(
        `${API_URL}/api/loyalty/hotel/rewards?${params.toString()}`,
        getAuthHeaders(getState)
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch rewards');
    }
  }
);

/**
 * Update reward
 */
export const updateReward = createAsyncThunk(
  'loyalty/updateReward',
  async ({ rewardId, rewardData }, { getState, rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/loyalty/hotel/rewards/${rewardId}`,
        rewardData,
        getAuthHeaders(getState)
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update reward');
    }
  }
);

/**
 * Delete reward
 */
export const deleteReward = createAsyncThunk(
  'loyalty/deleteReward',
  async (rewardId, { getState, rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_URL}/api/loyalty/hotel/rewards/${rewardId}`,
        getAuthHeaders(getState)
      );
      return { rewardId, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete reward');
    }
  }
);

/**
 * Export member report
 */
export const exportMemberReport = createAsyncThunk(
  'loyalty/exportMemberReport',
  async (_, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/loyalty/hotel/reports`,
        getAuthHeaders(getState)
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to export report');
    }
  }
);

// ============================================
// SLICE
// ============================================

const initialState = {
  // Guest data
  currentMembership: null,
  availableRewards: [],
  pointsHistory: null,
  redemptionHistory: null,
  programDetails: null,

  // Hotel admin data
  loyaltyProgram: null,
  members: [],
  membersPagination: null,
  selectedMember: null,
  analytics: null,
  rewards: [],

  // UI state
  loading: false,
  error: null,
  successMessage: null
};

const loyaltySlice = createSlice({
  name: 'loyalty',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    resetLoyaltyState: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    // Fetch My Membership
    builder
      .addCase(fetchMyMembership.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyMembership.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMembership = action.payload.member;
        state.programDetails = {
          tierDetails: action.payload.tierDetails,
          program: action.payload.program
        };
      })
      .addCase(fetchMyMembership.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Available Rewards
    builder
      .addCase(fetchAvailableRewards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableRewards.fulfilled, (state, action) => {
        state.loading = false;
        state.availableRewards = action.payload;
      })
      .addCase(fetchAvailableRewards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Redeem Reward
    builder
      .addCase(redeemReward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(redeemReward.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
        // Update membership points if available
        if (state.currentMembership) {
          state.currentMembership.availablePoints = action.payload.data.remainingPoints;
        }
      })
      .addCase(redeemReward.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Points History
    builder
      .addCase(fetchPointsHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPointsHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.pointsHistory = action.payload.pointsHistory;
        state.redemptionHistory = action.payload.redemptionHistory;
      })
      .addCase(fetchPointsHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Program Details
    builder
      .addCase(fetchProgramDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProgramDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.programDetails = action.payload;
      })
      .addCase(fetchProgramDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create or Update Program
    builder
      .addCase(createOrUpdateProgram.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrUpdateProgram.fulfilled, (state, action) => {
        state.loading = false;
        state.loyaltyProgram = action.payload;
        state.successMessage = 'Loyalty program saved successfully';
      })
      .addCase(createOrUpdateProgram.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Loyalty Program
    builder
      .addCase(fetchLoyaltyProgram.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLoyaltyProgram.fulfilled, (state, action) => {
        state.loading = false;
        state.loyaltyProgram = action.payload;
      })
      .addCase(fetchLoyaltyProgram.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Members
    builder
      .addCase(fetchMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.members = action.payload.data;
        state.membersPagination = action.payload.pagination;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Member Details
    builder
      .addCase(fetchMemberDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMemberDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedMember = action.payload;
      })
      .addCase(fetchMemberDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Adjust Member Points
    builder
      .addCase(adjustMemberPoints.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adjustMemberPoints.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
        state.selectedMember = action.payload.data.member;
      })
      .addCase(adjustMemberPoints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Change Member Tier
    builder
      .addCase(changeMemberTier.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changeMemberTier.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
        state.selectedMember = action.payload.data.member;
      })
      .addCase(changeMemberTier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Loyalty Analytics
    builder
      .addCase(fetchLoyaltyAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLoyaltyAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchLoyaltyAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create Reward
    builder
      .addCase(createReward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReward.fulfilled, (state, action) => {
        state.loading = false;
        state.rewards.push(action.payload);
        state.successMessage = 'Reward created successfully';
      })
      .addCase(createReward.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Rewards
    builder
      .addCase(fetchRewards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRewards.fulfilled, (state, action) => {
        state.loading = false;
        state.rewards = action.payload;
      })
      .addCase(fetchRewards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Reward
    builder
      .addCase(updateReward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReward.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.rewards.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.rewards[index] = action.payload;
        }
        state.successMessage = 'Reward updated successfully';
      })
      .addCase(updateReward.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete Reward
    builder
      .addCase(deleteReward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReward.fulfilled, (state, action) => {
        state.loading = false;
        state.rewards = state.rewards.filter(r => r._id !== action.payload.rewardId);
        state.successMessage = action.payload.message;
      })
      .addCase(deleteReward.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Export Member Report
    builder
      .addCase(exportMemberReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportMemberReport.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = 'Report exported successfully';
      })
      .addCase(exportMemberReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearSuccessMessage, resetLoyaltyState } = loyaltySlice.actions;

export default loyaltySlice.reducer;
