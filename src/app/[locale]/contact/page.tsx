import { Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ContactForm } from "./contact-form";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import { SectionHeading } from "@/components/section-heading";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const tt = await getTranslations("tooltips");
  const t = await getTranslations("contact");
  return (
    <section className="container-page py-24 md:py-28 grid gap-12 md:grid-cols-12">
      <div className="md:col-span-5">
        <SectionHeading level="h1" kicker={t("kicker")} tooltip={tt("contact")}>
          {t("heading")}
        </SectionHeading>
        <p className="mt-6 text-lg">{t("description")}</p>
        <div className="mt-10 space-y-4 text-sm">
          <a
            href="mailto:fischer_eduard@yahoo.com"
            className="flex items-center gap-3 text-foreground-muted hover:text-accent"
          >
            <Mail className="h-4 w-4" />
            fischer_eduard@yahoo.com
          </a>
          <a
            href="https://www.linkedin.com/in/eduard-fischer-szava/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-foreground-muted hover:text-accent"
          >
            <LinkedinIcon className="h-4 w-4" />
            linkedin.com/in/eduard-fischer-szava
          </a>
          <a
            href="https://github.com/EduardF1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-foreground-muted hover:text-accent"
          >
            <GithubIcon className="h-4 w-4" />
            github.com/EduardF1
          </a>
        </div>
      </div>
      <div className="md:col-span-7">
        <ContactForm />
      </div>
    </section>
  );
}
