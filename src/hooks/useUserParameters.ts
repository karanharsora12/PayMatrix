import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchUserParameters,
  selectCanManageAttendance,
  selectUserParameter,
  selectUserParameters,
} from '@/store/slices/userParametersSlice';

export function useUserParameters() {
  const dispatch = useAppDispatch();
  const parameters = useAppSelector(selectUserParameters);
  const canManageAttendance = useAppSelector(selectCanManageAttendance);
  const loading = useAppSelector((state) => state.userParameters.loading);
  const error = useAppSelector((state) => state.userParameters.error);
  const isInitialized = useAppSelector((state) => state.userParameters.isInitialized);

  const reload = useCallback(() => {
    return dispatch(fetchUserParameters()).unwrap();
  }, [dispatch]);

  const getUserParameter = useCallback(
    (name: string, defaultValue: boolean | string = false) => {
      return parameters[name] ?? defaultValue;
    },
    [parameters],
  );

  const hasUserParameter = useCallback(
    (name: string) => {
      return Boolean(parameters[name]);
    },
    [parameters],
  );

  return {
    parameters,
    canManageAttendance,
    loading,
    error,
    isInitialized,
    reload,
    getUserParameter,
    hasUserParameter,
  };
}

export function useCanManageAttendance(): boolean {
  return useAppSelector(selectCanManageAttendance);
}
