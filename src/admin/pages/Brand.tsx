import { BrandSettings } from '../../brand'
import { useMe } from '../AdminApp'
import { A } from '../text'
import { Notice } from '../ui'
import { PageTitle } from './common'

/** The shop owner's brand editor (the form itself lives in the reusable brand module). */
export function BrandPage() {
  const owner = useMe().role === 'owner'
  return (
    <div data-testid="admin-brand" className="space-y-4 lg:max-w-[560px]">
      <PageTitle title={A.nav.brand} />
      {!owner && <Notice>Brendni faqat loyiha egasi o'zgartira oladi.</Notice>}
      <p className="text-[13px] text-navy-soft">O'zgarishlar darhol qo'llanadi. Demo rejimda faqat shu qurilmada saqlanadi.</p>
      <BrandSettings disabled={!owner} />
    </div>
  )
}
