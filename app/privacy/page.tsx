import type { Metadata } from "next";
import { Lexend } from "next/font/google";

const lexend = Lexend({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Privacy Policy – Primenivaas",
};

export default function PrivacyPolicyPage() {
  return (
    <main className={`${lexend.className} min-h-screen bg-gray-50`}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy – Primenivaas</h1>
        <p className="text-sm text-gray-500 mb-10">
          Last updated: 2024
        </p>

        <div className="space-y-6 text-gray-800 leading-relaxed">
          <p>
            At Primenivaas, we are committed to protecting your privacy and ensuring the security of your personal
            information. This Privacy Policy explains how Primenivaas and its affiliated entities collect, use, store,
            share, and protect your personal data when you access or use our website, mobile application, or related
            services (collectively referred to as the Platform).
          </p>
          <p>
            By accessing or using the Platform, you agree to the collection and use of your personal data in accordance
            with this Privacy Policy. Where required by law, we will obtain your explicit consent for specific data
            processing activities.
          </p>

          <h2 className="text-xl font-semibold mt-8">1. Personal Data We Collect</h2>
          <p>We may collect the following categories of personal data.</p>

          <h3 className="text-lg font-semibold mt-6">A. Information You Provide Directly</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>
              Personal details: name, email address, phone number, address, username, and login credentials
            </li>
            <li>
              Property information: property type, location, size, pricing, amenities, photos, videos, and descriptions
            </li>
            <li>
              Identification documents: Aadhaar, PAN, passport, voter ID, driving license, property documents, utility
              bills, or ownership proofs where legally required
            </li>
            <li>
              Payment information: payments are processed through secure third-party gateways. Primenivaas does not
              store your bank, card, or UPI details.
            </li>
            <li>
              Communication records: calls, emails, chats, messages, feedback, complaints, and support queries
            </li>
            <li>
              Voice data: if you choose voiceovers for property videos, we may process voice recordings solely for that
              purpose
            </li>
            <li>Any other information shared voluntarily with your consent</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6">B. Information Collected Automatically</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Usage data: searches, preferences, activity logs, time spent, and interactions</li>
            <li>Technical data: IP address, browser type, device information, operating system, and language preferences</li>
            <li>Location data: approximate location such as city, state, or country</li>
            <li>Cookies and tracking data to enhance user experience and platform performance</li>
            <li>Transactional data: order and service history excluding sensitive financial details</li>
            <li>
              App permissions: camera, location, phone, notifications, and photos or videos only with your permission
            </li>
            <li>Analytics and insight data to understand usage patterns and improve services</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6">C. Information from Third Parties</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Advertising and marketing partners</li>
            <li>Publicly available sources</li>
            <li>Social login providers, such as name, email, or phone number</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">2. How We Use Your Personal Data</h2>
          <p>Primenivaas uses your data for the following purposes.</p>

          <h3 className="text-lg font-semibold mt-6">A. Platform and Service Delivery</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Account registration and verification</li>
            <li>Property listing, promotion, and management</li>
            <li>Connecting buyers, renters, owners, agents, and developers</li>
            <li>Showing relevant properties and user profiles</li>
            <li>Enabling voiceovers in property videos</li>
            <li>Providing personalised recommendations and search results</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6">B. Marketing and Promotions</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Sending offers, updates, and promotional messages where you have consented</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6">C. Third-Party Services</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>
              Sharing your details with banks, NBFCs, or partners when you express interest in loans or related
              services
            </li>
          </ul>

          <h3 className="text-lg font-semibold mt-6">D. Platform Improvement</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Research, surveys, analytics, feature development, and performance tracking</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6">E. Fraud Prevention and Security</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Verifying users and listings</li>
            <li>Detecting suspicious or illegal activity</li>
            <li>Preventing fraud and ensuring platform safety</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6">F. Support and Communication</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Responding to queries, complaints, and feedback</li>
            <li>Providing customer support and technical assistance</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6">G. Legal and Compliance</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Meeting legal obligations</li>
            <li>Protecting legal rights and resolving disputes</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">3. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar technologies to remember user preferences, improve functionality and performance,
            and analyse platform usage. You may control or disable cookies through your browser settings, but some
            features may not function properly if cookies are disabled.
          </p>

          <h2 className="text-xl font-semibold mt-8">4. Sharing of Personal Data</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Service providers for hosting, verification, analytics, communication, and support</li>
            <li>Other platform users such as buyers, sellers, brokers, or agents for property communication</li>
            <li>Financial partners such as banks or NBFCs for loan services with your consent</li>
            <li>Legal authorities when required by law or legal process</li>
            <li>Corporate transaction parties in case of merger, acquisition, or restructuring</li>
            <li>Professional advisors including lawyers, auditors, or consultants</li>
          </ul>
          <p>
            Primenivaas is not responsible for the privacy practices of third-party websites or services linked on the
            Platform.
          </p>

          <h2 className="text-xl font-semibold mt-8">5. Your Rights</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Access, correct, update, or delete your personal data</li>
            <li>Withdraw consent for data processing where applicable</li>
            <li>Opt out of promotional communications</li>
          </ul>
          <p>
            To exercise your rights, you can contact us at{" "}
            <a href="mailto:support@primenivaas.com" className="text-blue-600 hover:underline">
              support@primenivaas.com
            </a>
            . Some services may not be available if essential data is withdrawn.
          </p>

          <h2 className="text-xl font-semibold mt-8">6. Data Storage and Security</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Data is primarily stored and processed in India.</li>
            <li>We apply physical, technical, and administrative safeguards.</li>
            <li>Third-party processors are required to follow similar security standards.</li>
            <li>We take reasonable steps to protect against unauthorised access, loss, or misuse.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">7. Data Retention</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>We retain personal data as long as necessary to provide services.</li>
            <li>We retain data to comply with legal obligations.</li>
            <li>We retain data for fraud prevention and dispute resolution.</li>
            <li>Anonymised and aggregated data may be retained for a longer period.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
