import { LogIn, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export const MainNav = () => {
	return (
		<nav className="flex items-center justify-between w-full mb-8">
			<Link to="/" className="text-xl font-bold">
				Identity Radio
			</Link>
			
			<div className="flex items-center gap-4">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon">
							<Menu className="h-5 w-5" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem asChild>
							<Link to="/login" className="w-full">
								<LogIn className="mr-2 h-4 w-4" />
								<span>Login</span>
							</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</nav>
	);
};