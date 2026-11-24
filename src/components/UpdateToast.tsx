import { refreshToNewVersion, updateReady } from '../app/pwa';

export function UpdateToast() {
  if (!updateReady.value) return null;
  return (
    <div class="toast toast--update" role="status">
      <span>A new version of Hostbook is ready.</span>
      <button type="button" class="btn btn--small btn--on-dark" onClick={refreshToNewVersion}>
        Refresh
      </button>
    </div>
  );
}
