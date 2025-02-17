import Company from '../models/company.model.js';
import Individual from '../models/individual.model.js';

export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate('mainPerson')
      .populate('individuals');

    const companiesWithCounts = await Promise.all(
      companies.map(async (company) => {
        const cardCounts = await company.cardCounts;
        return {
          ...company.toObject(),
          ...cardCounts
        };
      })
    );

    res.json(companiesWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCompanyStats = async (req, res) => {
  try {
    const companies = await Company.find();
    const individuals = await Individual.find();
    
    const stats = {
      totalCompanies: companies.length,
      totalIndividuals: individuals.length,
      redCards: 0,
      orangeCards: 0,
      greenCards: 0
    };

    individuals.forEach(individual => {
      const daysUntilExpiry = Math.ceil(
        (new Date(individual.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilExpiry <= 5) {
        stats.redCards++;
      } else if (daysUntilExpiry <= 10) {
        stats.orangeCards++;
      } else {
        stats.greenCards++;
      }
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 