import React, { useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { addGroup } from '@utils/groups';
import { useRouter } from 'next/router';

const AddGroup = () => {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await addGroup(groupName);
      if (response) {
        toast.success('Group created successfully');
        router.push('/controlhub/groups');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/groups" subTitle="Add Group" />
      <div className="page-header-title">
        <h2 className="mb-0">Add New Group</h2>
      </div>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Group Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    required
                  />
                </Form.Group>
                <div className="d-flex gap-2">
                  <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Group'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => router.push('/controlhub/groups')}
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

AddGroup.getLayout = (page: React.ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AddGroup;
