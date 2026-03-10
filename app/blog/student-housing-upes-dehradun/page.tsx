import Image from "next/image";
import Link from "next/link";
import { Calendar, User, CheckCircle, Phone, Mail, MapPin } from "lucide-react";

export default function StudentHousingUPESArticle() {
  const title = "Premium Student Hoslet Near UPES University – Ready to Lease";
  const author = "Primenivaas Editorial";
  const date = "Feb 11, 2026";
  const hero = "/hostel.jpeg";
  const intro =
    "The demand for quality student hoslet is rapidly increasing in educational hubs across India. With universities expanding and student populations growing every year, well-equipped accommodation has become a crucial requirement. Primenivaas presents an excellent opportunity for investors and companies with its ready-to-lease student hoslet property located near UPES University, Dehradun.";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-72 md:h-96">
        <Image src={hero} alt={title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-8 py-6 max-w-5xl mx-auto text-white">
          <h1 className="text-3xl md:text-4xl font-extrabold">{title}</h1>
          <div className="flex items-center gap-6 mt-3 text-sm text-white/90">
            <span className="inline-flex items-center"><User className="w-4 h-4 mr-2" />{author}</span>
            <span className="inline-flex items-center"><Calendar className="w-4 h-4 mr-2" />{date}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-8 py-10">
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-7 mb-8">{intro}</p>
          
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
            <Image
              src="/Hostel2.jpeg"
              alt="Additional view of Primenivaas student hoslet"
              fill
              className="object-cover"
              priority={false}
            />
          </div>
          


          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Main Features</h3>
          <ul className="grid md:grid-cols-2 gap-3 list-none p-0">
            <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Capacity: 250 – 300 Students</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Units: 54 Fully Furnished Flats</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Area: 1 Acre (Newly Constructed)</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Location: Near UPES University, Dehradun</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Modern Amenities</h3>
          <ul className="grid md:grid-cols-2 gap-3 list-none p-0">
            <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Fully Furnished (Beds & Wardrobes)</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Smart LED TVs & Fridge</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> High-Speed Wi-Fi</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Modern Laundry Services</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Spacious & Green Campus</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Commercial Terms</h3>
          <ul className="list-none p-0">
            <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-blue-600" /> Price: ₹15 Lakh / Month</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-blue-600" /> Available for Long-term Lease</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Contact Details</h3>
          <div className="space-y-2">
            <p className="flex items-center gap-2"><Phone className="w-5 h-5 text-gray-700" /> Call/WhatsApp: +91 9319851474</p>
            <p className="flex items-center gap-2"><Mail className="w-5 h-5 text-gray-700" /> Email: primenivaas@gmail.com</p>
            <p className="flex items-center gap-2"><MapPin className="w-5 h-5 text-gray-700" /> Address: Near UPES University, Dehradun</p>
          </div>
          <div className="mt-6">
            <Link 
              href="/contact" 
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-lg shadow hover:bg-blue-700 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
        <div className="mt-10">
          <Link href="/blog" className="text-blue-600 font-medium">← Back to Blog</Link>
        </div>
      </div>
    </div>
  );
}
