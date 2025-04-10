'use client';

import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { DomainStatEntry } from '@/app/types/EmailData';
import { saveAs } from 'file-saver';

const EmailStats: React.FC = () => {
  const [emailData, setEmailData] = useState<DomainStatEntry[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [searchDomain, setSearchDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchData = async (email: string) => {
    try {
      setLoading(true);
      setCurrentPage(1);
      setStartDate(''); // 🔥 clear start date
      setEndDate('');   // 🔥 clear end date
      const res = await axios.get<{ response: DomainStatEntry[] }>(
        `https://kenlyser.kenscio.in:3000/domainstats?email=${email}`
      );
      setEmailData(res.data.response);
      setCurrentEmail(email);
    } catch (err) {
      console.error('Error fetching data:', err);
      setEmailData([]);
    } finally {
      setLoading(false);
    }
  };
  

  const filteredData = useMemo(() => {
    return emailData
      .filter((entry) => {
        // Filter by domain
        if (searchDomain) {
          return entry.domains.some((domain) =>
            domain.toLowerCase().includes(searchDomain.toLowerCase())
          );
        }
        return true;
      })
      .filter((entry) => {
        // Filter by start & end date
        const entryDate = new Date(entry.received_date);
        const afterStart = startDate ? entryDate >= new Date(startDate) : true;
        const beforeEnd = endDate ? entryDate <= new Date(endDate) : true;
        return afterStart && beforeEnd;
      });
  }, [emailData, searchDomain, startDate, endDate]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const exportToCSV = () => {
    const header = ['Received Date', 'Total Emails', 'Total Domains', 'Domains'];
    const rows = filteredData.map((entry) => [
      new Date(entry.received_date).toLocaleString(),
      entry.total_email,
      entry.total_domains,
      entry.domains.join(', '),
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map((item) => `"${item}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'email_stats.csv');
  };

  return (
    <div className="p-4 overflow-x-auto">
      <h2 className="text-2xl font-bold mb-4">📅 Domain Stats Per Email</h2>

      {/* Email Input */}
      <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
        <input
          type="email"
          placeholder="Enter email to fetch stats..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 w-full sm:w-64"
        />
        <button
          onClick={() => fetchData(searchEmail)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Search
        </button>
      </div>
      <h2 className="text-xl font-semibold mb-4">
      🕵 Currently viewing stats for: 
        <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-xl shadow-sm font-bold">
          {currentEmail}
        </span>
      </h2>

      {/* Date Range Filter */}
      {emailData.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <div>
            <label className="text-sm font-medium">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-3 py-1 ml-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-3 py-1 ml-2"
            />
          </div>
        </div>
      )}

      {/* Domain Filter & Export */}
      {emailData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
          <input
            type="text"
            placeholder="Filter by domain..."
            value={searchDomain}
            onChange={(e) => {
              setSearchDomain(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded px-3 py-1 w-full sm:w-64"
          />
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
      )}

      {/* Table or Loading */}
      {loading ? (
        <div>Loading data...</div>
      ) : emailData.length === 0 ? (
        <div>No data yet. Try searching an email above! 🔍</div>
      ) : (
        <>
          <table className="min-w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Received Date</th>
                <th className="border px-4 py-2">Total Emails</th>
                <th className="border px-4 py-2">Total Domains</th>
                <th className="border px-4 py-2">Domains</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((entry, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">
                    {new Date(entry.received_date).toLocaleString()}
                  </td>
                  <td className="border px-4 py-2 text-center">{entry.total_email}</td>
                  <td className="border px-4 py-2 text-center">{entry.total_domains}</td>
                  <td className="border px-4 py-2">
                    <details>
                      <summary className="cursor-pointer text-blue-600">
                        View Domains ({entry.domains.length})
                      </summary>
                      <ul className="list-disc list-inside mt-2">
                        {entry.domains.map((domain, i) => (
                          <li key={i}>{domain}</li>
                        ))}
                      </ul>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="mt-4 flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              ← Prev
            </button>
            <span>Page {currentPage}</span>
            <button
              onClick={() =>
                setCurrentPage((p) =>
                  p * itemsPerPage < filteredData.length ? p + 1 : p
                )
              }
              disabled={currentPage * itemsPerPage >= filteredData.length}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EmailStats;
