export default function SoftBackdrop() {
    return (
        <div className="fixed inset-0 -z-1 pointer-events-none">
            <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[980px] h-[460px] bg-linear-to-tr from-violet-800/40 to-transparent rounded-full blur-3xl light:from-violet-300/45" />
            <div className="absolute right-12 bottom-10 w-[420px] h-[220px] bg-linear-to-bl from-fuchsia-700/40 to-transparent rounded-full blur-2xl light:from-fuchsia-300/35" />
        </div>
    )
}
