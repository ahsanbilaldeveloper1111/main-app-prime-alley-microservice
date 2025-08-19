import React, { useRef, useState } from "react";
import { Button, Card, Col, Dropdown, Row } from 'react-bootstrap';
import DatePicker from "react-datepicker";
import CreatableSelect from 'react-select/creatable';


import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

// CSS Modules, react-datepicker-cssmodules.css
// import 'react-datepicker/dist/react-datepicker-cssmodules.css';

export default function CallLogsFilter() {

  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedName =name.replace(/_/g, ' ');
    const formattedName = updatedName.charAt(0).toUpperCase() + updatedName.slice(1);
    setSelectedFilters((prev) => ({
      ...prev,
      [formattedName]: value
    }));
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  const handleApplyFilters = () => {
    if (dropdownRef.current) {
      dropdownRef.current.classList.remove("show");
      dropdownRef.current.blur();
     // toast.success("Filters applied successfully");
    }
  
  };
  

 
  const [selectedExtension, setSelectedExtension] = useState<any[]>([]);
  const handleChange = (selected: any) => {
    setSelectedExtension(selected || []);
    const valuesArray = (selected || []).map((opt: any) => opt.value);
    //console.log('Selected values:', valuesArray);
  };

  const [selectedExtensionNumbers, setSelectedExtensionNumbers] = useState<any[]>([]);
  const handleChangeExtensionNumbers = (selected: any) => {
    setSelectedExtensionNumbers(selected || []);
    const valuesArray = (selected || []).map((opt: any) => opt.value);
    //console.log('Selected values:', valuesArray);
  };


  const [selectedRemoteNumber, setSelectedRemoteNumber] = useState<any[]>([]);

  const handleChangeRemoteNumber = (selected: any) => {
    setSelectedRemoteNumber(selected || []);
    const valuesArray = (selected || []).map((opt: any) => opt.value);
    //console.log('Selected values:', valuesArray);
  };
  

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  return <div className="d-flex align-items-center ms-auto gap-2">
    
    <div className="d-flex align-items-center gap-2 mt-3">
    {Object.entries(selectedFilters).map(([key, value]) => (
  <p key={key} className="badge bg-primary" style={{fontSize: '12px', marginRight: '5px'}}>
    {key}: {value}
    <span
      
      className="btn-close btn-close-white ms-2 text-white"
      onClick={() => {
        setSelectedFilters((prev) => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      }}
    ></span>
  </p>
))}
    </div>
                        
  <Dropdown>
                          <Dropdown.Toggle variant="primary" size='sm'>
                                <span className="ti ti-filter"></span>
                                Filters
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="filterBoxDropdown" style={{width: '500px'}} ref={dropdownRef}>
                            <Dropdown.ItemText>

                          
                            <Row>
                                <Col md={5} className="bg-gray-200 p-3 filterBox">
                                      <div className='filterBox-content'>
                                      <ul className="nav flex-column nav-pills" role="tablist" aria-orientation="vertical">
                          
                                            <li>
                                                  <button className="nav-tab-link active" data-bs-toggle="pill"  data-bs-target="#v-pills-pane-1" id="v-pills-tab-1" role="tab" aria-controls="v-pills-tab-1" aria-selected="true">
                                                        <span className="ti ti-phone-call"></span>
                                                        <span className="ms-2">Call Direction</span>
                                                        

                                                  </button>
                                            </li>

                                            <li>
                                                  <button className="nav-tab-link" data-bs-toggle="pill"  data-bs-target="#v-pills-pane-2" id="v-pills-tab-2" role="tab" aria-controls="v-pills-tab-2" aria-selected="true">
                                                        <span className="ti ti-calendar-event"></span>
                                                        <span className="ms-2">Date Selection</span>
                                                  </button>
                                            </li>

                                            <li>
                                                  <button className="nav-tab-link" data-bs-toggle="pill"  data-bs-target="#v-pills-pane-3" id="v-pills-tab-3" role="tab" aria-controls="v-pills-tab-3" aria-selected="true">
                                                        <span className="ti ti-phone-call"></span>
                                                        <span className="ms-2">Extension</span>
                                                  </button>
                                            </li>

                                           


                                </ul>
                                      </div>
                                </Col>
                                <Col md={7}>
                                <div className="tab-content" id="v-pills-tabContent">
                                            
                                            <div className="tab-pane fade show active" 
                                                  id="v-pills-pane-1" role="tabpanel"       
                                                  aria-labelledby="v-pills-tab-1">

                                                        <Card>
                                                              <Card.Header className="p-3 bg-gray-200">
                                                                    <h5>Call Direction</h5>
                                                              </Card.Header>
                                                              <Card.Body>
                                                              <div className="form-group">
  <div className="form-check mb-2">
    <input
      className="form-check-input"
      type="radio"
      name="callDirection"
      value="inbound"
      id="flexRadioDefault1"
      onChange={handleRadioChange}

    />
    <label className="" htmlFor="flexRadioDefault1">
      Inbound
    </label>
  </div>

  <div className="form-check mb-2">
    <input
      className="form-check-input"
      type="radio"
      name="callDirection"
      value="outbound"
      id="flexRadioDefault2"
      onChange={handleRadioChange}

    />
    <label className="" htmlFor="flexRadioDefault2">
      Outbound
    </label>
  </div>

  <div className="form-check mb-2">
    <input
      className="form-check-input"
      type="radio"
      name="callDirection"
      value="both"
      id="flexRadioDefault3"
      onChange={handleRadioChange}

    />
    <label className="" htmlFor="flexRadioDefault3">
      Both
    </label>
  </div>
</div>
                                                              </Card.Body>
                                                            
                                                        </Card>

                                                  
                                                  
                                            </div>

                                            <div className="tab-pane fade" id="v-pills-pane-2" role="tabpanel" aria-labelledby="v-pills-tab-2">

                                                  <Card>
                                                              <Card.Header className="p-3 bg-gray-200">
                                                                    <h5>Date Selection</h5>
                                                              </Card.Header>
                                                              <Card.Body>

                                                              <div className="form-group mb-2">
                                                        <label className="form-label mb-1">Start Date</label>
                                                        <DatePicker 
                                                          selected={startDate}
                                                          dateFormat="yyyy-MM-dd"
                                                          showYearDropdown
                                                          className="form-control"
                                                            onChange={(date) => {
                                                              setStartDate(date || new Date());
                                                            if (date) {
                                                              setSelectedFilters((prev) => ({
                                                                ...prev,
                                                                startDate: date.toISOString().split('T')[0]
                                                              }));
                                                            }
                                                          }}
                                                        />
                                                  </div>
                                                  <div className="form-group mb-2">
                                                        <label className="form-label mb-1">End Date</label>
                                                        <DatePicker
                                                          selected={endDate}
                                                          dateFormat="yyy-mm-dd"
                                                          showYearDropdown
                                                          className="form-control"
                                                          onChange={(date) => {
                                                            setEndDate(date || new Date());
                                                            if (date) {
                                                              setSelectedFilters((prev) => ({
                                                                ...prev,
                                                                endDate: date.toISOString().split('T')[0]
                                                              }));
                                                            }
                                                          }}
                                                        />
                                                  </div>
                                                

                                                              </Card.Body>

                                                  </Card>

                                            </div>


                                            <div className="tab-pane fade" id="v-pills-pane-3" role="tabpanel" aria-labelledby="v-pills-tab-3">

                                                  <Card>
                                                              <Card.Header className="p-3 bg-gray-200">
                                                                    <h5>Extension</h5>
                                                              </Card.Header>
                                                              <Card.Body className="p-3">
                                                  
                                                  <div className="form-group mb-2">
                                                        <label className="form-label mb-1 font-normal">Extension Names</label>
                                                        <CreatableSelect
                                                        isMulti                                                  onChange={handleChange}
                                                        value={selectedExtension}
                                                        placeholder="Type to create"
                                                        />
                                                  </div>

                                                  <div className="form-group mb-2">
                                                        <label className="form-label mb-1 font-normal">Extension Numbers</label>
                                                        <CreatableSelect
                                                        isMulti 
                                                        onChange={handleChangeExtensionNumbers}
                                                        value={selectedExtensionNumbers}
                                                        placeholder="Type to create"
                                                        />
                                                  </div>

                                                              </Card.Body>

                                                  </Card>

                                            </div>



                                            <div className="tab-pane fade" id="v-pills-pane-4" role="tabpanel" aria-labelledby="v-pills-tab-4">

                                                  <Card>
                                                              <Card.Header className="p-3 bg-gray-200">
                                                                    <h5>Remote Number</h5>
                                                              </Card.Header>
                                                              <Card.Body>
                                                  <div className="form-group mb-2">
                                                        <label className="form-label mb-1">Remote Number</label>
                                                        <CreatableSelect
                                                        isMulti
                                                        onChange={handleChangeRemoteNumber}
                                                        value={selectedRemoteNumber}
                                                        placeholder="Type to create"
                                                       
                                                        />

                                                  </div>

                                                              </Card.Body>

                                                  </Card>

                                            </div>


                                      </div>
                                </Col>
                          </Row> 
                          <Row>
                            <Col md={12} className="d-flex justify-content-end gap-2">
                            <Button variant="outline-primary" onClick={() => setSelectedFilters({})}>Clear Filters</Button>
                              <Button variant="primary" onClick={() => {
                               handleApplyFilters();
                              }}>Apply Filters</Button>
                            </Col>
                          </Row>
                            </Dropdown.ItemText>
                          </Dropdown.Menu>
                          
                    </Dropdown>
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-primary" id="dropdown-basic" size='sm'>
                        <span className="ti ti-download"></span>
                        Export
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item href="#/action-1">Excel</Dropdown.Item>
                        <Dropdown.Item href="#/action-2">PDF</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
              </div>;
}

