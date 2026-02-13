import LoginClient from "./LoginClient";

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function LoginPage({ searchParams }: Props) {
  const rawNext = searchParams?.next;
  const nextValue = Array.isArray(rawNext) ? rawNext[0] : rawNext;

  // Only allow internal redirects
  const nextPath =
    typeof nextValue === "string" && nextValue.startsWith("/")
      ? nextValue
      : "/dashboard";

  return <LoginClient nextPath={nextPath} />;
}
