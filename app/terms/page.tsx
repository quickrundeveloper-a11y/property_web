import type { Metadata } from "next";
import { Lexend } from "next/font/google";

const lexend = Lexend({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Terms & Conditions – Primenivaas",
};

export default function TermsPage() {
  return (
    <main className={`${lexend.className} min-h-screen bg-gray-50`}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms & Conditions – Primenivaas</h1>
        
        <div className="space-y-6 text-gray-800 leading-relaxed">
          <p className="font-medium">
            Please read these Terms & Conditions carefully before accessing or using the Primenivaas website or mobile application. By accessing or using Primenivaas, you agree to be bound by these Terms. If you do not agree, please do not use the Platform.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="font-medium text-blue-900">For any queries, you may contact us at:</p>
            <a href="mailto:legal@primenivaas.com" className="text-blue-600 hover:underline">📧 legal@primenivaas.com</a>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Introduction</h2>
          <p>
            Primenivaas (including its website, mobile applications, and related services, collectively referred to as the “Platform”) is an online real estate marketplace that enables users to buy, sell, and rent residential and commercial properties.
          </p>
          <p>
            These Terms & Conditions, together with our Privacy Policy and Community Guidelines, constitute a legally binding agreement between Primenivaas and the user (“User”).
          </p>
          <p>
            Primenivaas reserves the right to modify these Terms at any time. Continued use of the Platform after changes are posted constitutes acceptance of the revised Terms.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Definitions</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>User / Customer:</strong> Any individual or legal entity accessing or using Primenivaas.</li>
            <li><strong>Subscriber:</strong> A registered user using paid or free services.</li>
            <li><strong>Visitor:</strong> A person browsing the Platform without registration.</li>
            <li><strong>Advertiser:</strong> Any user listing a property for sale, rent, or lease.</li>
            <li><strong>Services:</strong> Online tools and features enabling property listing, discovery, communication, and related services.</li>
            <li><strong>Property Listing:</strong> Property information uploaded by an owner, agent, or authorized representative.</li>
          </ul>
          <p className="mt-2">
            Primenivaas acts only as an intermediary and does not act as an agent for any buyer, seller, landlord, or tenant.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Eligibility</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Users must be 18 years or older</li>
            <li>Users must provide accurate and lawful information</li>
            <li>Unauthorized access is strictly prohibited</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Property Listings & Advertisements</h2>
          <p>By posting a property on Primenivaas, you confirm that:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>You are the owner or legally authorized to advertise the property</li>
            <li>All details (price, size, location, ownership status) are true and accurate</li>
            <li>Required approvals under Real Estate (Regulation and Development) Act, 2016 (RERA) have been obtained, where applicable</li>
            <li>Property details are not misleading or fraudulent</li>
          </ul>
          <p className="mt-4">
            Primenivaas does not verify ownership documents and shall not be responsible for disputes between users.
          </p>
          <p>
            Primenivaas reserves the right to edit, reject, suspend, or remove any listing without notice.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. User Responsibilities</h2>
          <p>Users agree to:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Independently verify property details before any transaction</li>
            <li>Use the Platform only for lawful property-related purposes</li>
            <li>Not post false, duplicate, or misleading listings</li>
            <li>Not impersonate others or misrepresent facts</li>
          </ul>
          <p className="mt-4 font-medium">
            The “Verified” tag only confirms property existence, not legal ownership or pricing accuracy.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">6. Payments & Refunds</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>All paid services require 100% advance payment.</li>
            <li>Payments are non-refundable, unless explicitly stated otherwise.</li>
            <li>Primenivaas does not guarantee leads, responses, or actual transactions.</li>
            <li>
              Payments are processed via secure third-party gateways. Primenivaas does not store
              your card, bank, or UPI details.
            </li>
            <li>
              Refunds (if any) are processed on a best-effort basis and are subject to banking
              timelines.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">7. Platform Usage Restrictions</h2>
          <p>Users must not:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Scrape, copy, harvest, or misuse Platform data.</li>
            <li>Use bots, crawlers, or other automation tools to access the Platform.</li>
            <li>Re-sell, sub-license, or otherwise commercially exploit Primenivaas services.</li>
            <li>Create competing databases or derivative services using Platform data.</li>
            <li>Harass, spam, abuse, or threaten other users.</li>
            <li>Upload or share illegal, offensive, obscene, or harmful content.</li>
            <li>Attempt to hack, probe, or bypass any security or authentication measures.</li>
          </ul>
          <p className="mt-2">
            Any violation of the above may result in account suspension/termination and may also
            lead to civil and/or criminal action.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">8. Content & Intellectual Property</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              All logos, trademarks, design elements, text, graphics, and other Platform content are
              the exclusive property of Primenivaas or its licensors.
            </li>
            <li>
              Users receive a limited, non-transferable, revocable license to access and use the
              Platform for personal, lawful purposes.
            </li>
            <li>
              No part of the Platform may be copied, reproduced, modified, distributed, or
              republished without prior written permission from Primenivaas.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">9. Video Listings & Community Guidelines</h2>
          <p>Videos and media content uploaded to Primenivaas must:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Be original, lawful, and copyright-free.</li>
            <li>Not contain personal contact details within the video frames.</li>
            <li>Not be obscene, hateful, defamatory, or discriminatory.</li>
          </ul>
          <p className="mt-2">
            All videos and community content may be subject to human and automated review. Primenivaas
            may remove or restrict any content at its sole discretion if it violates these Terms or
            applicable laws.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">10. Disclaimer</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Primenivaas operates as an intermediary under applicable laws, including the Information
              Technology Act, 2000, and related rules.
            </li>
            <li>
              All information and content on the Platform are provided on an “as is” and “as
              available” basis without warranties of any kind, whether express or implied.
            </li>
            <li>
              Primenivaas does not guarantee property availability, pricing, or transaction success.
            </li>
            <li>Users access and transact on the Platform entirely at their own risk.</li>
            <li>
              Primenivaas does not endorse, guarantee, or recommend any project, seller, agent, or
              builder listed on the Platform.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">11. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Primenivaas shall not be liable for:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Any financial or business loss incurred by users.</li>
            <li>Property disputes between parties.</li>
            <li>Incorrect, outdated, or misleading listings posted by users.</li>
            <li>Missed opportunities, loss of data, or loss of goodwill.</li>
            <li>Technical failures, downtime, or interruptions of the Platform.</li>
          </ul>
          <p className="mt-2">
            In any event, Primenivaas&apos;s total aggregate liability, if established, shall be
            limited to the amount actually paid by the user for the specific paid service in
            question.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">12. Termination</h2>
          <p>Primenivaas may, at its sole discretion, suspend or terminate access to the Platform if:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>These Terms & Conditions are violated.</li>
            <li>Fraudulent, abusive, or suspicious activity is detected.</li>
            <li>Required by law enforcement, court order, or regulatory authorities.</li>
          </ul>
          <p className="mt-2">
            Upon termination, the user&apos;s right to access or use the Platform shall immediately
            cease. Certain obligations and liabilities incurred prior to termination shall survive.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">13. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Primenivaas, its directors, employees,
            affiliates, and partners from and against any claims, damages, losses, liabilities, costs,
            or expenses (including reasonable legal fees) arising out of or related to:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Your property listings or advertisements on the Platform.</li>
            <li>Your use or misuse of the Platform or its services.</li>
            <li>Your violation of these Terms or any applicable law.</li>
            <li>Your infringement of any third-party rights, including intellectual property or privacy rights.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">14. Privacy Policy</h2>
          <p>
            Your use of Primenivaas is also governed by our Privacy Policy, which explains how we
            collect, use, process, and protect your personal data. By using the Platform, you
            acknowledge that you have read and understood the Privacy Policy and agree to its terms.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">15. Arbitration</h2>
          <p>Any dispute, controversy, or claim arising out of or relating to these Terms or the use of the Platform shall be resolved through arbitration, as follows:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>The seat and venue of arbitration shall be New Delhi, India.</li>
            <li>The arbitration shall be conducted in accordance with the Arbitration and Conciliation Act, 1996, as amended from time to time.</li>
            <li>The decision of the arbitrator shall be final and binding on the parties.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">16. Governing Law & Jurisdiction</h2>
          <p>
            These Terms & Conditions shall be governed by and construed in accordance with the laws
            of India. Subject to the arbitration clause above, the courts at New Delhi shall have
            exclusive jurisdiction over all matters arising out of or in connection with these Terms
            or your use of the Platform.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">17. Severability & Waiver</h2>
          <p>
            If any provision of these Terms is held to be invalid, illegal, or unenforceable by a
            court or competent authority, the remaining provisions shall continue in full force and
            effect.
          </p>
          <p className="mt-2">
            Any failure or delay by Primenivaas in exercising any right or remedy under these Terms
            shall not constitute a waiver of such right or remedy, nor shall it prevent or restrict
            any further exercise of that or any other right or remedy.
          </p>
        </div>
      </div>
    </main>
  );
}
