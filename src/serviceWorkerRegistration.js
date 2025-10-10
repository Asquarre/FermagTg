const SERVICE_WORKER_URL = `${process.env.PUBLIC_URL || ''}/service-worker.js`;

const sendSkipWaitingMessage = (worker) => {
  if (worker) {
    worker.postMessage({ type: 'SKIP_WAITING' });
  }
};

const attachUpdateHandler = (registration) => {
  if (!registration) {
    return;
  }

  if (registration.waiting) {
    sendSkipWaitingMessage(registration.waiting);
  }

  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    if (!newWorker) {
      return;
    }

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        sendSkipWaitingMessage(newWorker);
      }
    });
  });
};

export const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL);
      attachUpdateHandler(registration);
      if (registration && typeof registration.update === 'function') {
        try {
          await registration.update();
        } catch (updateError) {
          console.error('Service Worker update check failed:', updateError);
        }

        setInterval(() => {
          registration.update().catch((intervalError) => {
            console.error('Service Worker periodic update failed:', intervalError);
          });
        }, 60 * 1000);
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  window.addEventListener('load', () => {
    register();

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) {
        return;
      }
      refreshing = true;
      window.location.reload();
    });
  });
};

export const unregisterServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    registration.unregister();
  }
};