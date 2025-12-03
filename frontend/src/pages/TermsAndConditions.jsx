import React from "react";
import RecruAINavbar from "../components/product/RecruAINavbar";
import Footer from "../components/Footer";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <RecruAINavbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8 sm:px-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Terms and Conditions
            </h1>

            <div className="prose prose-gray max-w-none">
              <p className="text-sm text-gray-600 mb-8">
                Last updated: November 30, 2025
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  1. Acceptance of Terms
                </h2>
                <p className="text-gray-700 mb-4">
                  By accessing and using RecruAI ("the Service"), you accept and
                  agree to be bound by the terms and provision of this
                  agreement. If you do not agree to abide by the above, please
                  do not use this service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  2. Description of Service
                </h2>
                <p className="text-gray-700 mb-4">
                  RecruAI is an AI-powered recruitment platform that provides:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li>AI-assisted interview scheduling and management</li>
                  <li>Candidate screening and evaluation tools</li>
                  <li>Automated interview analysis and feedback</li>
                  <li>Job posting and application management</li>
                  <li>Analytics and reporting features</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  3. User Accounts
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    To use certain features of the Service, you must register
                    for an account. When you register, you agree to:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700">
                    <li>Provide accurate and complete information</li>
                    <li>Maintain the security of your password and account</li>
                    <li>
                      Accept responsibility for all activities under your
                      account
                    </li>
                    <li>Notify us immediately of any unauthorized use</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  4. Acceptable Use Policy
                </h2>
                <p className="text-gray-700 mb-4">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Transmit harmful or malicious code</li>
                  <li>Harass, abuse, or harm others</li>
                  <li>Impersonate any person or entity</li>
                  <li>Interfere with the Service's operations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  5. Intellectual Property
                </h2>
                <p className="text-gray-700 mb-4">
                  The Service and its original content, features, and
                  functionality are and will remain the exclusive property of
                  MenteE and its licensors. The Service is protected by
                  copyright, trademark, and other laws.
                </p>
                <p className="text-gray-700">
                  You retain ownership of content you submit to the Service, but
                  grant us a license to use, display, and distribute such
                  content in connection with providing the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  6. Privacy and Data Protection
                </h2>
                <p className="text-gray-700 mb-4">
                  Your privacy is important to us. Please review our Privacy
                  Policy, which also governs your use of the Service, to
                  understand our practices.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  7. Payment Terms
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-700">For paid services:</p>
                  <ul className="list-disc pl-6 text-gray-700">
                    <li>
                      Payments are processed securely through our payment
                      providers
                    </li>
                    <li>
                      Subscription fees are billed in advance on a recurring
                      basis
                    </li>
                    <li>You may cancel your subscription at any time</li>
                    <li>Refunds are provided according to our refund policy</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  8. Termination
                </h2>
                <p className="text-gray-700 mb-4">
                  We may terminate or suspend your account and access to the
                  Service immediately, without prior notice or liability, for
                  any reason, including breach of these Terms.
                </p>
                <p className="text-gray-700">
                  Upon termination, your right to use the Service will cease
                  immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  9. Disclaimer of Warranties
                </h2>
                <p className="text-gray-700 mb-4">
                  The Service is provided on an "AS IS" and "AS AVAILABLE"
                  basis. We make no representations or warranties of any kind,
                  express or implied, as to the operation of the Service or the
                  information, content, or materials included therein.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  10. Limitation of Liability
                </h2>
                <p className="text-gray-700 mb-4">
                  In no event shall MenteE, its directors, employees, or agents
                  be liable for any indirect, incidental, special,
                  consequential, or punitive damages arising out of or related
                  to your use of the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  11. Governing Law
                </h2>
                <p className="text-gray-700 mb-4">
                  These Terms shall be interpreted and governed by the laws of
                  the State of California, United States, without regard to
                  conflict of law provisions.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  12. Changes to Terms
                </h2>
                <p className="text-gray-700 mb-4">
                  We reserve the right to modify these Terms at any time. We
                  will notify users of any changes by posting the new Terms on
                  this page and updating the "Last updated" date.
                </p>
                <p className="text-gray-700">
                  Your continued use of the Service after any such changes
                  constitutes your acceptance of the new Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  13. Contact Information
                </h2>
                <p className="text-gray-700">
                  If you have any questions about these Terms, please contact us
                  at:
                </p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">
                    <strong>Email:</strong> legal@mentee.ai
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

export default TermsAndConditions;
