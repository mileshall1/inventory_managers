
'use client';
import { useEffect, useState } from 'react';

const ClientOnlyComponent = () => {
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  if (!isBrowser) {
    return null; // or a loading indicator
  }

  return (
    <div>
      {/* Browser-dependent code here */}
    </div>
  );
};

export default ClientOnlyComponent;
