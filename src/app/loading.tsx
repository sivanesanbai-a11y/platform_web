import CylindricalLoader from '@/components/CylindricalLoader';

export default function RootLoading() {
  return (
    <main className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '75vh' }}>
      <CylindricalLoader text="LOADING" />
    </main>
  );
}
