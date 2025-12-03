import React from "react";
import RecruAINavbar from "../components/product/RecruAINavbar";
import Footer from "../components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <RecruAINavbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8 sm:px-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Privacy Policy
            </h1>

            <div className="prose prose-gray max-w-none">
              <p className="text-sm text-gray-600 mb-8">
                Last updated: November 30, 2025
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  1. Introduction
                </h2>
                <p className="text-gray-700 mb-4">
                  At MenteE ("we," "us," or "our"), we are committed to
                  protecting your privacy and ensuring the security of your
                  personal information. This Privacy Policy explains how we
                  collect, use, disclose, and safeguard your information when
                  you use our RecruAI platform.
                </p>
                <p className="text-gray-700">
                  By using our Service, you agree to the collection and use of
                  information in accordance with this policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  2. Information We Collect
                </h2>

                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  2.1 Personal Information
                </h3>
                <p className="text-gray-700 mb-4">
                  We may collect the following personal information:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li>Name and contact information (email, phone number)</li>
                  <li>
                    Professional information (resume, work experience,
                    education)
                  </li>
                  <li>Account credentials and profile information</li>
                  <li>Communication preferences</li>
                  <li>
                    Payment information (processed securely by third-party
                    providers)
                  </li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  2.2 Usage Data
                </h3>
                <p className="text-gray-700 mb-4">
                  We automatically collect certain information when you use our
                  Service:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li>IP address and location information</li>
                  <li>Browser type and version</li>
                  <li>Pages visited and time spent on our Service</li>
                  <li>Device information and operating system</li>
                  <li>Referral sources</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  2.3 Interview Data
                </h3>
                <p className="text-gray-700 mb-4">
                  For interview-related features, we may collect:
                </p>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>Interview recordings and transcripts</li>
                  <li>AI-generated analysis and feedback</li>
                  <li>Performance metrics and scoring</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  3. How We Use Your Information
                </h2>
                <p className="text-gray-700 mb-4">
                  We use the collected information for various purposes:
                </p>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>To provide and maintain our Service</li>
                  <li>To process transactions and manage subscriptions</li>
                  <li>To communicate with you about our Service</li>
                  <li>To provide customer support</li>
                  <li>To analyze usage patterns and improve our Service</li>
                  <li>To comply with legal obligations</li>
                  <li>To detect and prevent fraud</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  4. Information Sharing and Disclosure
                </h2>
                <p className="text-gray-700 mb-4">
                  We may share your information in the following circumstances:
                </p>

                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  4.1 With Service Providers
                </h3>
                <p className="text-gray-700 mb-4">
                  We may share information with third-party service providers
                  who assist us in operating our Service, such as payment
                  processors, cloud hosting providers, and analytics services.
                </p>

                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  4.2 Business Transfers
                </h3>
                <p className="text-gray-700 mb-4">
                  If we are involved in a merger, acquisition, or sale of
                  assets, your information may be transferred as part of that
                  transaction.
                </p>

                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  4.3 Legal Requirements
                </h3>
                <p className="text-gray-700 mb-4">
                  We may disclose your information if required by law or in
                  response to legal processes, such as subpoenas or court
                  orders.
                </p>

                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  4.4 With Your Consent
                </h3>
                <p className="text-gray-700">
                  We may share information with your explicit consent for
                  specific purposes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  5. Data Security
                </h2>
                <p className="text-gray-700 mb-4">
                  We implement appropriate technical and organizational measures
                  to protect your personal information against unauthorized
                  access, alteration, disclosure, or destruction. These measures
                  include:
                </p>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication requirements</li>
                  <li>Secure data centers and infrastructure</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  6. Data Retention
                </h2>
                <p className="text-gray-700 mb-4">
                  We retain your personal information only as long as necessary
                  for the purposes outlined in this Privacy Policy, unless a
                  longer retention period is required by law. When we no longer
                  need your information, we will securely delete or anonymize
                  it.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  7. Your Rights
                </h2>
                <p className="text-gray-700 mb-4">
                  Depending on your location, you may have the following rights
                  regarding your personal information:
                </p>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>
                    <strong>Access:</strong> Request a copy of your personal
                    information
                  </li>
                  <li>
                    <strong>Correction:</strong> Request correction of
                    inaccurate information
                  </li>
                  <li>
                    <strong>Deletion:</strong> Request deletion of your personal
                    information
                  </li>
                  <li>
                    <strong>Portability:</strong> Request transfer of your data
                  </li>
                  <li>
                    <strong>Restriction:</strong> Request limitation of
                    processing
                  </li>
                  <li>
                    <strong>Objection:</strong> Object to processing based on
                    legitimate interests
                  </li>
                </ul>
                <p className="text-gray-700 mt-4">
                  To exercise these rights, please contact us at
                  privacy@mentee.ai.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  8. Cookies and Tracking
                </h2>
                <p className="text-gray-700 mb-4">
                  We use cookies and similar tracking technologies to enhance
                  your experience on our Service. You can control cookie
                  settings through your browser preferences.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  9. Third-Party Services
                </h2>
                <p className="text-gray-700 mb-4">
                  Our Service may contain links to third-party websites or
                  services. We are not responsible for the privacy practices of
                  these third parties. We encourage you to review their privacy
                  policies.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  10. Children's Privacy
                </h2>
                <p className="text-gray-700 mb-4">
                  Our Service is not intended for children under 13 years of
                  age. We do not knowingly collect personal information from
                  children under 13. If we become aware that we have collected
                  personal information from a child under 13, we will take steps
                  to delete such information.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  11. International Data Transfers
                </h2>
                <p className="text-gray-700 mb-4">
                  Your information may be transferred to and processed in
                  countries other than your own. We ensure appropriate
                  safeguards are in place to protect your information during
                  such transfers.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  12. Changes to This Privacy Policy
                </h2>
                <p className="text-gray-700 mb-4">
                  We may update this Privacy Policy from time to time. We will
                  notify you of any changes by posting the new Privacy Policy on
                  this page and updating the "Last updated" date.
                </p>
                <p className="text-gray-700">
                  We encourage you to review this Privacy Policy periodically to
                  stay informed about our privacy practices.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  13. Contact Us
                </h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions about this Privacy Policy or our
                  privacy practices, please contact us:
                </p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">
                    <strong>Email:</strong> privacy@mentee.ai
                  </p>
                  <p className="text-gray-700">
                    <strong>Address:</strong> 123 Innovation Drive, Tech Valley,
                    CA 94043, United States
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
