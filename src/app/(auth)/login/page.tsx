import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/profile";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Log in</h1>
      <LoginForm next={next} />
      <p className="text-sm">
        Need an account?{" "}
        <Link href="/signup" className="font-medium underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
