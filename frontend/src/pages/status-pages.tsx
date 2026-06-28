import { Card } from '../components/ui/card'
import { useI18n } from '../i18n/use-i18n'
import { Page } from './shared'

export function ChangePasswordPage() { const { t } = useI18n(); return <Page title={t.changePassword}><Card>{t.ready}</Card></Page> }
export function ForbiddenPage() { const { t } = useI18n(); return <Page title={t.forbidden}><Card>{t.forbidden}</Card></Page> }
export function NotFoundPage() { const { t } = useI18n(); return <Page title={t.notFound}><Card>{t.notFound}</Card></Page> }
