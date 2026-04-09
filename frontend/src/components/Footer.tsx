import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-card border-t border-border mt-20">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-lg font-bold text-gradient mb-4">StayNest</h3>
          <p className="text-sm text-muted-foreground">Your trusted rental marketplace. Find unique stays across India.</p>
        </div>
        {[
          { title: "Explore", links: ["All Listings", "Categories", "Superhosts", "Deals"] },
          { title: "Hosting", links: ["Become a Host", "Host Dashboard", "Pricing Tools", "Resources"] },
          { title: "Support", links: ["Help Center", "Safety", "Cancellation", "Report Issue"] },
        ].map(({ title, links }) => (
          <div key={title}>
            <h4 className="font-semibold mb-3">{title}</h4>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l}><Link to="/listings" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-sm text-muted-foreground">© 2026 StayNest. Group 22 — MIT Manipal DBMS Project.</p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Privacy</span><span>Terms</span><span>Sitemap</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
