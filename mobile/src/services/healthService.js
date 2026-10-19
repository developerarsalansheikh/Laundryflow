import axios from 'axios';
import { API_BASE_URL, HEALTH_CHECK_URL } from '../constants/api';
import { useNetworkStore } from '../store/networkStore';

/**
 * HealthService — Proactively monitors backend availability, detects Render cold-starts,
 * and provides manual & automatic reconnection recovery for LaundryFlow mobile app.
 */
class HealthService {
  constructor() {
    this.isChecking = false;
    this.checkTimeout = 12000; // 12 seconds per probe
  }

  /**
   * Ping backend health endpoint
   * @param {boolean} isManualRetry - True if triggered by user tapping "Retry Connection"
   */
  async checkServerHealth(isManualRetry = false) {
    if (this.isChecking) return;
    this.isChecking = true;

    const startTime = Date.now();
    try {
      // First try /health on root domain, fallback to /api/health
      const targetUrl = HEALTH_CHECK_URL || `${API_BASE_URL}/health`;

      const response = await axios.get(targetUrl, {
        timeout: this.checkTimeout,
        headers: { Accept: 'application/json' },
      });

      const latencyMs = Date.now() - startTime;
      console.log(`[HealthService] Server healthy | Latency: ${latencyMs}ms | Status: ${response.status}`);

      useNetworkStore.getState().reportRequestSuccess();
      return { ok: true, latencyMs };
    } catch (error) {
      const isTimeout =
        error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.toLowerCase().includes('timeout');

      const isNetwork =
        error.message === 'Network Error' ||
        error.code === 'ERR_NETWORK' ||
        error.code === 'ENOTFOUND' ||
        !error.response;

      const status = error.response?.status;
      const isServerDown = status === 502 || status === 503 || status === 504 || isTimeout;

      console.warn(`[HealthService] Health check failed | Status: ${status ?? 'Network/Timeout'} | Message: ${error.message}`);

      if (isNetwork) {
        useNetworkStore.getState().setNetworkState({
          isConnected: false,
          isServerReachable: false,
          isColdStarting: false,
          lastErrorType: 'offline',
        });
      } else if (isServerDown) {
        // Render cold start or temporarily unavailable
        useNetworkStore.getState().setNetworkState({
          isConnected: true,
          isServerReachable: false,
          isColdStarting: true,
          lastErrorType: 'cold_start',
        });
      }

      return {
        ok: false,
        isNetwork,
        isServerDown,
        error,
      };
    } finally {
      this.isChecking = false;
    }
  }
}

export const healthService = new HealthService();
export default healthService;
