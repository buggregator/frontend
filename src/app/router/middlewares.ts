import { storeToRefs } from 'pinia';
import { RouteAuthAccessError, RouteAvailabilityError } from '@/shared/lib/errors';
import { useProfileStore, useSettingsStore } from '@/shared/stores';
import { RouteName, EventTypes } from '@/shared/types';
import { type TRouterMiddleware } from './types';

export const auth: TRouterMiddleware = async ({ to, next }) => {
  const settingsStore = useSettingsStore();
  const { isFetched, isAuthEnabled } = storeToRefs(settingsStore);

  if (!isFetched.value) {
    await settingsStore.fetchSettings();
  }

  if (!isAuthEnabled.value) {
    if (to.name === RouteName.Login) {
      next({ name: RouteName.Home });
    }

    return;
  }

  const profileStore = useProfileStore();
  const { isAuthenticated } = storeToRefs(profileStore);

  await profileStore.getStoredToken();

  if (isAuthenticated.value) {
    try {
      await profileStore.getProfile();
    } catch (e) {
      throw new RouteAuthAccessError('Access denied', to.path);
    }
  }

  if (to.name !== RouteName.Login && !isAuthenticated.value) {
    throw new RouteAuthAccessError('Access denied', to.path);
  }

  if (to.name === RouteName.Login && to?.query?.token) {
    profileStore.setToken(String(to.query.token));
  }

  return;
};

export const checkType: TRouterMiddleware = async ({ to, next }) => {
  const pageType = to.params.type;

  if (!pageType) {
    next({ name: to.name });

    return;
  }

  if (Array.isArray(pageType)) {
    throw new RouteAvailabilityError('Invalid Path parameter', to.path);
  }

  if (
    !Object.values(RouteName).includes(pageType as RouteName) &&
    !Object.values(EventTypes).includes(pageType as EventTypes)
  ) {
    throw new RouteAvailabilityError('Invalid Path', to.path);
  }

  return;
};
