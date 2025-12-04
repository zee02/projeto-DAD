<template>
    <div>
        <NavigationMenu>
            <NavigationMenuList class="justify-around gap-20">
                <NavigationMenuItem>
                    <NavigationMenuTrigger>Testing</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <li>
                            <NavigationMenuLink as-child>
                                <RouterLink to="/testing/laravel">Laravel</RouterLink>
                            </NavigationMenuLink>
                            <NavigationMenuLink as-child>
                                <RouterLink to="/testing/websockets">Web Sockets</RouterLink>
                            </NavigationMenuLink>
                        </li>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem v-if="!userLoggedIn">
                    <NavigationMenuLink>
                        <RouterLink to="/login">Login</RouterLink>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem v-else>
                    <NavigationMenuLink>
                        <RouterLink to="/profile">Profile</RouterLink>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem v-if="userLoggedIn && user && user.type === 'A'">
                    <NavigationMenuLink>
                        <RouterLink to="/admin">Admin</RouterLink>
                    </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem v-if="userLoggedIn">
                    <NavigationMenuLink>
                        <a @click.prevent="logoutClickHandler">Logout</a>
                    </NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    </div>
</template>

<script setup>
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'


const emits = defineEmits(['logout'])
const { userLoggedIn, user } = defineProps(['userLoggedIn', 'user'])

const logoutClickHandler = () => {
    emits('logout')
}
</script>
