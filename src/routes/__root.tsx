import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
    component: () => (
        <>
            <nav className="p-4 flex gap-4 bg-gray-100">
                <Link to="/" className="[&.active]:font-bold text-blue-600">
                    Home
                </Link>
            </nav>
            <hr />
            <div className="p-4">
                {/* The child routes will render inside this Outlet */}
                <Outlet />
            </div>
            <TanStackRouterDevtools position="bottom-right" />
        </>
    ),
})