import {useState} from 'react'
import {Dialog, DialogBackdrop, DialogPanel, TransitionChild} from '@headlessui/react'
import {
  Bars3Icon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  DocumentCurrencyDollarIcon,
  FolderIcon,
  HomeIcon,
  PowerIcon,
  UserIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {Outlet} from "react-router-dom";
import {useAuthenticator} from "@aws-amplify/ui-react";

const navigation = [
  {name: 'Inicio', href: '/inicio', icon: HomeIcon, current: true},
  {name: 'Legislaturas', href: '/legislaturas', icon: BriefcaseIcon, current: false},
  {name: 'Senadores', href: '/senadores', icon: UsersIcon, current: false},
  {name: 'Proyectos', href: '/proyectos', icon: FolderIcon, current: false},
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const {user, signOut} = useAuthenticator(context => [context.user]);

  return (
    <>
      <div>
        <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
          />

          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-[closed]:-translate-x-full"
            >
              <TransitionChild>
                <div
                  className="absolute left-full top-0 flex w-16 justify-center pt-5 duration-300 ease-in-out data-[closed]:opacity-0">
                  <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon aria-hidden="true" className="h-6 w-6 text-white"/>
                  </button>
                </div>
              </TransitionChild>
              {/* Sidebar component, swap this element with another sidebar if you like */}
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
                <nav className="flex flex-1 flex-col mt-5">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => (
                          <li key={item.name}>
                            <a
                              href={item.href}
                              className={classNames(
                                item.current
                                  ? 'bg-gray-50 text-indigo-600'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                                'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
                              )}
                            >
                              <item.icon
                                aria-hidden="true"
                                className={classNames(
                                  item.current ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600',
                                  'h-6 w-6 shrink-0',
                                )}
                              />
                              {item.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
            <nav className="flex flex-1 flex-col mt-5">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className={classNames(
                            item.current
                              ? 'bg-gray-50 text-indigo-600'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                            'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
                          )}
                        >
                          <item.icon
                            aria-hidden="true"
                            className={classNames(
                              item.current ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600',
                              'h-6 w-6 shrink-0',
                            )}
                          />
                          {item.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
                <li className="-mx-6 mt-auto mb-5">
                  <div
                    className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-800 hover:text-gray-700">
                    <UserIcon className="h-6 w-6 rounded-full bg-gray-50"/>
                    <span aria-hidden="true">{user?.signInDetails?.loginId}</span>
                  </div>
                  <a onClick={signOut}
                     className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-rose-800 hover:text-rose-700 hover:bg-gray-50 cursor-pointer">
                    <PowerIcon className="h-5 w-5 rounded-full bg-gray-50"/>
                    <span aria-hidden="true">Cerrar Sesión</span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
          <button type="button" onClick={() => setSidebarOpen(true)} className="-m-2.5 p-2.5 text-gray-700 lg:hidden">
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon aria-hidden="true" className="h-6 w-6"/>
          </button>
          <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">Dashboard</div>
          <a onClick={signOut} className="cursor-pointer">
            <span className="sr-only">Cerrar Sesión</span>
            <PowerIcon className="h-5 w-5 rounded-full text-rose-800 bg-rose-50"/>
          </a>
        </div>
        <main className="py-10 lg:pl-72">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet/>
          </div>
        </main>
      </div>
    </>
  );
}
