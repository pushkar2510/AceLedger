import { Metadata } from 'next';
import { GitScrapperPage } from '@/components/gitscrapper/git-scrapper-page';

export const metadata: Metadata = {
  title: 'Project Intelligence',
  description: 'Analyze GitHub repositories and view verifiable contributor stats.',
};

export default function GitScrapperRoute() {
  return (
    <div className="container py-8 max-w-6xl mx-auto space-y-6">
      <GitScrapperPage />
    </div>
  );
}
