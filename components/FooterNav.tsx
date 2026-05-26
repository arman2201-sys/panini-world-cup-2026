import Link from "next/link";
import { text } from "@/lib/i18n";
import type { Language } from "@/lib/album";

type Props = {
  language: Language;
  page: "admin" | "share";
};

export function FooterNav({ language, page }: Props) {
  const t = text[language];

  return (
    <footer className="site-footer">
      <div>
        <span className="kicker">{t.appName}</span>
        <p>{t.publicShare}</p>
      </div>
      <nav className="footer-nav" aria-label="Navigation">
        <Link className={page === "share" ? "footer-link active" : "footer-link"} href="/share">
          {t.shareNav}
        </Link>
        <Link className={page === "admin" ? "footer-link active" : "footer-link"} href="/">
          {t.adminNav}
        </Link>
      </nav>
    </footer>
  );
}
