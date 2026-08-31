// admin-ui/app/(admin)/blogs/new/page.tsx
// Full-Screen Dedicated Blog Article Creator Page

import FullScreenBlogEditor from '../_components/full-screen-blog-editor';

export default function NewBlogPage() {
  return (
    <div className="w-full">
      <FullScreenBlogEditor />
    </div>
  );
}
