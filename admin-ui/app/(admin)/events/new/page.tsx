// admin-ui/app/(admin)/events/new/page.tsx
// Full-Screen Dedicated Event Creator Page

import FullScreenEventEditor from '../_components/full-screen-event-editor';

export default function NewEventPage() {
  return (
    <div className="w-full">
      <FullScreenEventEditor />
    </div>
  );
}
