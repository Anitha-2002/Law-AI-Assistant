import { configureStore } from '@reduxjs/toolkit'
import { legalApi } from './api/legalApi'

export const store = configureStore({
  reducer: {
    [legalApi.reducerPath]: legalApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(legalApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

