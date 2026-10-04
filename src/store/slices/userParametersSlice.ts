import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { parametersApi } from '@/api/parameters';

export interface UserParametersState {
  parameters: Record<string, boolean | string>;
  CanManageAttendance: boolean;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: UserParametersState = {
  parameters: {
    CanManageAttendance: false,
  },
  CanManageAttendance: false,
  loading: false,
  error: null,
  isInitialized: false,
};

export const fetchUserParameters = createAsyncThunk(
  'userParameters/fetchUserParameters',
  async (_, { rejectWithValue }) => {
    try {
      const data = await parametersApi.getMyParameters();
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to load user parameters',
      );
    }
  },
);

export const userParametersSlice = createSlice({
  name: 'userParameters',
  initialState,
  reducers: {
    clearUserParameters: () => {
      return { ...initialState };
    },
    setUserParameter: (
      state,
      action: PayloadAction<{ name: string; value: boolean | string }>,
    ) => {
      const { name, value } = action.payload;
      state.parameters[name] = value;
      if (name === 'CanManageAttendance') {
        state.CanManageAttendance = Boolean(value);
      }
    },
    setUserParameters: (
      state,
      action: PayloadAction<Record<string, boolean | string>>,
    ) => {
      state.parameters = { ...state.parameters, ...action.payload };
      if ('CanManageAttendance' in action.payload) {
        state.CanManageAttendance = Boolean(action.payload['CanManageAttendance']);
      }
      state.isInitialized = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserParameters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserParameters.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        state.parameters = {
          ...state.parameters,
          ...action.payload,
        };
        state.CanManageAttendance = Boolean(
          action.payload?.['CanManageAttendance'] ?? false,
        );
      })
      .addCase(fetchUserParameters.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load user parameters';
        // Safe default on failure
        state.CanManageAttendance = false;
      });
  },
});

export const { clearUserParameters, setUserParameter, setUserParameters } =
  userParametersSlice.actions;

// Selectors
export const selectUserParameters = (state: { userParameters: UserParametersState }) =>
  state.userParameters.parameters;

export const selectCanManageAttendance = (state: {
  userParameters: UserParametersState;
}) => state.userParameters.CanManageAttendance;

export const selectUserParameter = (
  state: { userParameters: UserParametersState },
  name: string,
  defaultValue: boolean | string = false,
) => state.userParameters.parameters[name] ?? defaultValue;

export default userParametersSlice.reducer;
