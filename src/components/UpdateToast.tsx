import { refreshToNewVersion, updateReady } from '../app/pwa';

export function UpdateToast() {
  if (!updateReady.value) return null;
  return (
    <div class="toast" role="status">
      <span>A new version of Hostbook is ready.</span>
      <button type="button" class="btn btn--small" onClick={refreshToNewVersion}>
        Refresh
      </button>
    </div>
  );
}
