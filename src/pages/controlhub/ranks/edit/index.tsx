import React, { useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

const EditRank = () => {
  const router = useRouter();
  const [rankName, setRankName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rankName.trim()) {
      toast.error('Please enter a rank name');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement rank update logic
      toast.success('Rank updated successfully');
      router.push('/controlhub/ranks');
    } catch (error) {
      console.error('Error updating rank:', error);
      toast.error('Failed to update rank');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/ranks" subTitle="Edit Rank" />
      <div className="page-header-title">
        <h2 className="mb-0">Edit Rank</h2>
      </div>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Rank Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={rankName}
                    onChange={(e) => setRankName(e.target.value)}
                    placeholder="Enter rank name"
                    required
                  />
                </Form.Group>
                <div className="d-flex gap-2">
                  <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Updating...' : 'Update Rank'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => router.push('/controlhub/ranks')}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

EditRank.getLayout = (page: React.ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default EditRank;
