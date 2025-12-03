import React from "react";
import RecruAINavbar from "../components/product/RecruAINavbar";
import Footer from "../components/Footer";

const CookiesPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <RecruAINavbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8 sm:px-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Cookies Policy
            </h1>

            <div className="prose prose-gray max-w-none">
              <p className="text-sm text-gray-600 mb-8">
                Last updated: November 30, 2025
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  1. What Are Cookies
                </h2>
                <p className="text-gray-700 mb-4">
                  Cookies are small text files that are stored on your computer
                  or mobile device when you visit our website. They help us
                  provide you with a better browsing experience by remembering
                  your preferences and understanding how you use our site.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  2. How We Use Cookies
                </h2>
                <p className="text-gray-700 mb-4">
                  We use cookies for the following purposes:
                </p>

                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  2.1 Essential Cookies
                </h3>
                <p className="text-gray-700 mb-4">
                  These cookies are necessary for the website to function
                  properly. They enable core functionality such as security,
                  network management, and accessibility. You cannot opt out of
                  these cookies without severely affecting the website's
                  functionality.
                </p>

                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  2.2 Analytics Cookies
                </h3>
                <p className="text-gray-700 mb-4">
                  These cookies help us understand how visitors interact with
                  our website by collecting and reporting information
                  anonymously. This helps us improve our website's performance
                  and user experience.
                </p>

                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  2.3 Functional Cookies
                </h3>
                <p className="text-gray-700 mb-4">
                  These cookies enable the website to remember choices you make
                  (such as your username, language, or the region you are in)
                  and provide enhanced, more personal features.
                </p>

                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  2.4 Marketing Cookies
                </h3>
                <p className="text-gray-700 mb-4">
                  These cookies are used to track visitors across websites to
                  display ads that are relevant and engaging for individual
                  users. We may share this information with advertisers.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  3. Types of Cookies We Use
                </h2>

                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                          Cookie Type
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                          Purpose
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">
                          Session Cookies
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          Maintain user session during browsing
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          Until browser closes
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">
                          Persistent Cookies
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          Remember user preferences
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          Up to 2 years
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">
                          Third-party Cookies
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          Analytics and advertising
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          Varies by provider
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  4. Third-Party Cookies
                </h2>
                <p className="text-gray-700 mb-4">
                  We may use third-party services that place cookies on your
                  device:
                </p>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>
                    <strong>Google Analytics:</strong> For website analytics and
                    performance monitoring
                  </li>
                  <li>
                    <strong>Stripe:</strong> For secure payment processing
                  </li>
                  <li>
                    <strong>Intercom:</strong> For customer support and
                    communication
                  </li>
                  <li>
                    <strong>LinkedIn:</strong> For social media integration and
                    advertising
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  5. Managing Cookies
                </h2>
                <p className="text-gray-700 mb-4">
                  You have several options for managing cookies:
                </p>

                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  5.1 Browser Settings
                </h3>
                <p className="text-gray-700 mb-4">
                  Most web browsers allow you to control cookies through their
                  settings. You can usually find these settings in the 'Options'
                  or 'Preferences' menu of your browser. You can set your
                  browser to block or alert you about cookies, but please note
                  that some parts of our site may not work properly without
                  cookies.
                </p>

                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  5.2 Opting Out
                </h3>
                <p className="text-gray-700 mb-4">
                  You can opt out of interest-based advertising by visiting the
                  following links:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li>
                    <a
                      href="https://www.google.com/settings/ads"
                      className="text-indigo-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Google Ad Settings
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.facebook.com/ads/preferences"
                      className="text-indigo-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Facebook Ad Preferences
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://optout.aboutads.info"
                      className="text-indigo-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Digital Advertising Alliance
                    </a>
                  </li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  5.3 Cookie Consent
                </h3>
                <p className="text-gray-700">
                  When you first visit our website, you'll see a cookie banner
                  that allows you to accept or reject non-essential cookies. You
                  can change your preferences at any time by clicking the cookie
                  settings link in our footer.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  6. Impact of Disabling Cookies
                </h2>
                <p className="text-gray-700 mb-4">
                  If you disable cookies, some features of our website may not
                  function properly. For example:
                </p>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>You may need to log in each time you visit</li>
                  <li>Your preferences may not be saved</li>
                  <li>Some content may not display correctly</li>
                  <li>
                    Analytics data may not be collected (which helps us improve)
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  7. Updates to This Policy
                </h2>
                <p className="text-gray-700 mb-4">
                  We may update this Cookies Policy from time to time to reflect
                  changes in our practices or for other operational, legal, or
                  regulatory reasons. We will notify you of any material changes
                  by posting the updated policy on this page.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  8. Contact Us
                </h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions about our use of cookies or this
                  Cookies Policy, please contact us:
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

export default CookiesPolicy;
